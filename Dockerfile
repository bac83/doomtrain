# Static-site image: nginx serves index.html + src/ over port 80.
FROM nginx:1.27-alpine

# Drop default site; copy game files.
RUN rm -rf /usr/share/nginx/html/*
COPY index.html /usr/share/nginx/html/index.html
COPY src/       /usr/share/nginx/html/src/

EXPOSE 80
