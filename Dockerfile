# Build the Expo web client.
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Do not bake a local machine's API address or secrets into the web bundle.
RUN rm -f .env && npx expo export --platform web

# Run the FastAPI API and serve the exported web client from the same origin.
FROM python:3.13-slim
WORKDIR /app/backend
COPY requirements.txt backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./web

EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
