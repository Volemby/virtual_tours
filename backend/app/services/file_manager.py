import os
import shutil
import zipfile
import re
import aiofiles
from fastapi import UploadFile, HTTPException
from app.config import settings
from app.schemas.tour import Tour

class FileManager:
    @staticmethod
    def sanitize_id(tour_id: str) -> str:
        # Allow alphanumeric, underscore, hyphen
        sanitized = re.sub(r'[^a-zA-Z0-9_-]', '', tour_id)
        if not sanitized:
            raise HTTPException(status_code=400, detail="Invalid Tour ID")
        return sanitized

    @staticmethod
    def get_tour_path(tour_id: str) -> str:
        return os.path.join(settings.TOURS_DIR, tour_id)
    
    @staticmethod
    def get_cover_path(tour_id: str) -> str:
        # Search for existing cover with any allowed extension
        for ext in settings.ALLOWED_COVER_EXTENSIONS:
            path = os.path.join(settings.COVERS_DIR, f"{tour_id}.{ext}")
            if os.path.exists(path):
                return path
        return None

    @staticmethod
    def get_main_html_file(tour_dir: str) -> str:
        # Look for preferred files
        preferred = ['index.htm', 'index.html', 'tour.html', 'main.html', 'home.html']
        
        # Check root
        if not os.path.exists(tour_dir):
            return None
            
        files = os.listdir(tour_dir)
        for p in preferred:
            if p in files:
                return p
        
        # Check specific pattern if not found
        html_files = [f for f in files if f.endswith(('.html', '.htm'))]
        if html_files:
            return html_files[0]
            
        return None

    @staticmethod
    def list_tours() -> list[Tour]:
        tours = []
        if not os.path.exists(settings.TOURS_DIR):
            return []
            
        for d in os.listdir(settings.TOURS_DIR):
            full_path = os.path.join(settings.TOURS_DIR, d)
            if os.path.isdir(full_path):
                main_file = FileManager.get_main_html_file(full_path)
                if main_file:
                    clean_name = d.replace('_', ' ').replace('-', ' ').title()
                    
                    # Determine cover URL
                    cover_path = FileManager.get_cover_path(d)
                    cover_url = None
                    if cover_path:
                        filename = os.path.basename(cover_path)
                        cover_url = f"/covers/{filename}"
                    
                    tours.append(Tour(
                        id=d,
                        name=clean_name,
                        url=f"/tours/{d}/{main_file}",
                        mainFile=main_file,
                        coverUrl=cover_url
                    ))
        return tours

    @staticmethod
    async def save_cover(tour_id: str, file: UploadFile):
        # Validate extension
        filename = file.filename
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if ext not in settings.ALLOWED_COVER_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Invalid cover extension. Allowed: {settings.ALLOWED_COVER_EXTENSIONS}")
        
        # Identify old cover (to delete)
        old_cover_path = FileManager.get_cover_path(tour_id)
        if old_cover_path:
            os.remove(old_cover_path)
            
        # Check size
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > settings.MAX_COVER_SIZE:
             raise HTTPException(status_code=400, detail=f"Cover file too large (Max {settings.MAX_COVER_SIZE // (1024*1024)}MB)")

        # Save new
        target_path = os.path.join(settings.COVERS_DIR, f"{tour_id}.{ext}")
        async with aiofiles.open(target_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        return f"/covers/{tour_id}.{ext}"

    @staticmethod
    async def save_tour(tour_id: str, zip_file: UploadFile, overwrite: bool = False):
        tour_path = FileManager.get_tour_path(tour_id)
        
        # Check existence
        if os.path.exists(tour_path):
            if overwrite:
                shutil.rmtree(tour_path)
            else:
                raise HTTPException(status_code=400, detail="Tour ID already exists")

        # Create temp zip path
        temp_zip = os.path.join(settings.TOURS_DIR, f"{tour_id}_temp.zip")
        
        try:
            # Save Zip
            import aiofiles
            # Check size before reading into memory
            # Helper to get size
            zip_file.file.seek(0, 2)
            size = zip_file.file.tell()
            zip_file.file.seek(0)
            
            if size > settings.MAX_TOUR_SIZE:
                raise HTTPException(status_code=400, detail=f"Tour ZIP too large (Max {settings.MAX_TOUR_SIZE // (1024*1024)}MB)")

            async with aiofiles.open(temp_zip, 'wb') as out_file:
                content = await zip_file.read() 
                await out_file.write(content)

            # Extract
            with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
                # Security check: don't allow extracting outside target
                 # Just use extractall to a temp dir then move
                temp_extract_dir = os.path.join(settings.TOURS_DIR, f"{tour_id}_extract")
                os.makedirs(temp_extract_dir, exist_ok=True)
                zip_ref.extractall(temp_extract_dir)
                
                # Logic to flatten:
                # If extract dir contains only one folder, redundant.
                items = os.listdir(temp_extract_dir)
                items = [i for i in items if i not in ['.', '..', '__MACOSX']]
                
                source_dir = temp_extract_dir
                if len(items) == 1 and os.path.isdir(os.path.join(temp_extract_dir, items[0])):
                    source_dir = os.path.join(temp_extract_dir, items[0])
                
                # Move to final destination
                shutil.move(source_dir, tour_path)
                
                # Cleanup temp extract root if it was flattened
                if source_dir != temp_extract_dir:
                    shutil.rmtree(temp_extract_dir)

        except zipfile.BadZipFile:
            raise HTTPException(status_code=400, detail="Invalid ZIP file")
        finally:
            if os.path.exists(temp_zip):
                os.remove(temp_zip)

        # Check if valid tour (has HTML)
        main_file = FileManager.get_main_html_file(tour_path)
        if not main_file:
            shutil.rmtree(tour_path)
            raise HTTPException(status_code=400, detail="No HTML file found in ZIP")

        return True

    @staticmethod
    def rename_tour(old_id: str, new_id: str):
        old_path = FileManager.get_tour_path(old_id)
        new_path = FileManager.get_tour_path(new_id)

        if not os.path.exists(old_path):
             raise HTTPException(status_code=404, detail="Tour not found")

        if os.path.exists(new_path):
             raise HTTPException(status_code=400, detail="New Tour ID already exists")

        # Rename directory
        shutil.move(old_path, new_path)

        # Rename cover if exists
        old_cover_path = FileManager.get_cover_path(old_id)
        if old_cover_path:
            ext = old_cover_path.split('.')[-1]
            new_cover_path = os.path.join(settings.COVERS_DIR, f"{new_id}.{ext}")
            shutil.move(old_cover_path, new_cover_path)
        
        return True

    @staticmethod
    def delete_tour(tour_id: str):
        tour_path = FileManager.get_tour_path(tour_id)
        if os.path.exists(tour_path):
            shutil.rmtree(tour_path)
            
        cover_path = FileManager.get_cover_path(tour_id)
        if cover_path:
            os.remove(cover_path)
        return True
