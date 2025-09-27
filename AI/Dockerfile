FROM python:3.11-slim-bookworm

WORKDIR /app

COPY biosage/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY biosage ./biosage

EXPOSE 8009

CMD ["uvicorn", "biosage.app.main:app", "--host", "0.0.0.0", "--port", "8009"]
