FROM nginx:alpine

# Install PHP and PHP-FPM with ZIP extension
RUN apk add --no-cache php83 php83-fpm php83-json php83-fileinfo php83-curl php83-session php83-zip

# Create PHP-FPM configuration
RUN echo "[www]" > /etc/php83/php-fpm.d/www.conf && \
    echo "user = nginx" >> /etc/php83/php-fpm.d/www.conf && \
    echo "group = nginx" >> /etc/php83/php-fpm.d/www.conf && \
    echo "listen = 127.0.0.1:9000" >> /etc/php83/php-fpm.d/www.conf && \
    echo "pm = dynamic" >> /etc/php83/php-fpm.d/www.conf && \
    echo "pm.max_children = 5" >> /etc/php83/php-fpm.d/www.conf && \
    echo "pm.start_servers = 2" >> /etc/php83/php-fpm.d/www.conf && \
    echo "pm.min_spare_servers = 1" >> /etc/php83/php-fpm.d/www.conf && \
    echo "pm.max_spare_servers = 3" >> /etc/php83/php-fpm.d/www.conf

# Configure PHP for large file uploads
RUN echo "upload_max_filesize = 100M" >> /etc/php83/php.ini && \
    echo "post_max_size = 100M" >> /etc/php83/php.ini && \
    echo "max_execution_time = 300" >> /etc/php83/php.ini && \
    echo "memory_limit = 256M" >> /etc/php83/php.ini

# Create directories with proper permissions
RUN mkdir -p /usr/share/nginx/html/covers /usr/share/nginx/html/tours && \
    chown nginx:nginx /usr/share/nginx/html/covers /usr/share/nginx/html/tours && \
    chmod 755 /usr/share/nginx/html/covers /usr/share/nginx/html/tours

# Create startup script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo '# Fix permissions on startup' >> /docker-entrypoint.sh && \
    echo 'chown -R nginx:nginx /usr/share/nginx/html/covers /usr/share/nginx/html/tours 2>/dev/null || true' >> /docker-entrypoint.sh && \
    echo 'chmod 755 /usr/share/nginx/html/covers /usr/share/nginx/html/tours 2>/dev/null || true' >> /docker-entrypoint.sh && \
    echo 'php-fpm83 -D' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
