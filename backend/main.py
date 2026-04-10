from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes import user, recommend, behavior

app = FastAPI(title="AI Hackathon Health API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(recommend.router)
app.include_router(behavior.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# In an optimal deployment, we can mount frontend statically directly onto FastAPI 
# instead of running 2 servers if they are in the same Docker container.
import os
if os.path.isdir("../frontend"):
    app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    # Running on 8080 specifically for Cloud Run requirement
    uvicorn.run(app, host="0.0.0.0", port=8080)
