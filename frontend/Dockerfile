FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY index.html .
COPY privacy.html .
COPY 404.html .
COPY css/ ./css/
COPY js/ ./js/
COPY fotos/ ./fotos/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
