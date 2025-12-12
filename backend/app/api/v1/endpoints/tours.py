from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List
from app.schemas.tour import Tour, TourResponse
from app.services.file_manager import FileManager

router = APIRouter()

@router.get("/", response_model=List[Tour])
async def list_tours():
    """
    List all available tours.
    """
    return FileManager.list_tours()

@router.post("/", response_model=TourResponse)
async def upload_tour(
    tourId: str = Form(...),
    tourZip: UploadFile = File(...),
    coverPhoto: UploadFile = File(...)
):
    """
    Upload a new tour.
    """
    try:
        sanitized_id = FileManager.sanitize_id(tourId)
        
        # Save Cover
        await FileManager.save_cover(sanitized_id, coverPhoto)
        
        # Save Tour
        await FileManager.save_tour(sanitized_id, tourZip)
        
        return TourResponse(
            success=True,
            message="Tour uploaded successfully",
            data=Tour(
                id=sanitized_id,
                name=sanitized_id.replace('_', ' ').replace('-', ' ').title(),
                url=f"/tours/{sanitized_id}/{FileManager.get_main_html_file(FileManager.get_tour_path(sanitized_id))}",
                mainFile="index.html", # Placeholder, logic in service handles this dynamic lookup
                coverUrl=f"/covers/{sanitized_id}.{coverPhoto.filename.split('.')[-1]}"
            )
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{tour_id}", response_model=TourResponse)
async def update_tour(
    tour_id: str,
    newTourId: str = Form(None),
    tourZip: UploadFile = File(None),
    coverPhoto: UploadFile = File(None)
):
    """
    Update an existing tour (rename, replace zip, update cover).
    """
    try:
        current_id = tour_id
        
        # 1. Rename if requested
        if newTourId and newTourId != tour_id:
            sanitized_new_id = FileManager.sanitize_id(newTourId)
            FileManager.rename_tour(tour_id, sanitized_new_id)
            current_id = sanitized_new_id

        # 2. Replace Zip if provided
        if tourZip:
            # We enforce overwrite=True since we are updating
            await FileManager.save_tour(current_id, tourZip, overwrite=True)

        # 3. Update Cover if provided
        if coverPhoto:
            await FileManager.save_cover(current_id, coverPhoto)

        # Return updated tour data
        # Fetch fresh data to ensure we have correct mainFile etc
        tour_path = FileManager.get_tour_path(current_id)
        main_file = FileManager.get_main_html_file(tour_path)
        
        # Get cover url
        cover_path = FileManager.get_cover_path(current_id)
        cover_url = None
        if cover_path:
             filename = cover_path.split('/')[-1]
             cover_url = f"/covers/{filename}"

        return TourResponse(
            success=True,
            message="Tour updated successfully",
            data=Tour(
                id=current_id,
                name=current_id.replace('_', ' ').replace('-', ' ').title(),
                url=f"/tours/{current_id}/{main_file}" if main_file else "",
                mainFile=main_file or "", 
                coverUrl=cover_url
            )
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{tour_id}", response_model=TourResponse)
async def delete_tour(tour_id: str):
    """
    Delete a tour and its cover photo.
    """
    try:
        FileManager.delete_tour(tour_id)
        return TourResponse(success=True, message=f"Tour {tour_id} deleted successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{tour_id}/cover", response_model=TourResponse)
async def update_cover(
    tour_id: str,
    coverPhoto: UploadFile = File(...)
):
    """
    Update cover photo for a tour.
    """
    try:
        url = await FileManager.save_cover(tour_id, coverPhoto)
        return TourResponse(success=True, message="Cover updated", data=None)
    except HTTPException as e:
        raise e
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))
