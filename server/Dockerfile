FROM python:3.10-alpine
WORKDIR /tree105/server
COPY ./requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
VOLUME /tree105
EXPOSE 4242
CMD ["python", "server.py"]
#EXPOSE 4242 5678
