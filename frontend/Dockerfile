FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5173
ENV VITE_BACKEND_URL=http://backend:8080
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
