import httpx
import asyncio

async def verify_counts():
    base_url = "http://localhost:8000/api"
    
    async with httpx.AsyncClient() as client:
        # Login
        login_res = await client.post(f"{base_url}/auth/login", data={
            "username": "admin@looplab.io",
            "password": "AdminPassword123!"
        })
        if login_res.status_code != 200:
            print("Login failed")
            return
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get jobs
        list_res = await client.get(f"{base_url}/job-posts/", headers=headers)
        if list_res.status_code == 200:
            jobs = list_res.json()["items"]
            for job in jobs:
                print(f"Job: {job['title']} | Count: {job['application_count']}")
        else:
            print(f"Failed to list jobs: {list_res.status_code}")

if __name__ == "__main__":
    asyncio.run(verify_counts())
