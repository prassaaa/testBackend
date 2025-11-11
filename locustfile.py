"""
Locust Load Testing for Backend Test Project

This file tests the performance targets:
- API Response Time: <100ms (p95)
- Cache Hit Rate: >90%
- Database Query Time: <50ms (p95)
- WebSocket Latency: <50ms

Run with: locust -f locustfile.py --host=http://localhost:3000
"""

from locust import HttpUser, task, between, events
from locust.contrib.fasthttp import FastHttpUser
import random
import json
import time

# List of cities to test
CITIES = ["Jakarta"]

# Sample usernames for chat testing
USERNAMES = [f"user_{i}" for i in range(1, 21)]

# Sample group data
GROUP_IDS = []


class WeatherAPIUser(FastHttpUser):
    """
    User that primarily interacts with Weather API endpoints.
    Uses FastHttpUser for better performance.
    """
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    @task(10)  # Higher weight - most common operation
    def get_current_weather(self):
        """Test GET /api/weather/current/:city endpoint (cached)"""
        city = random.choice(CITIES)
        with self.client.get(
            f"/api/weather/current/{city}",
            name="/api/weather/current/[city]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                # City not found, fetch it first
                response.failure("City not found - need to fetch first")
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(3)
    def get_weather_history(self):
        """Test GET /api/weather/history/:city endpoint with pagination"""
        city = random.choice(CITIES)
        page = random.randint(1, 5)
        page_size = random.choice([10, 20, 50])
        
        with self.client.get(
            f"/api/weather/history/{city}?page={page}&pageSize={page_size}",
            name="/api/weather/history/[city]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(1)
    def fetch_weather_data(self):
        """Test POST /api/weather/fetch/:city endpoint"""
        city = random.choice(CITIES)
        with self.client.post(
            f"/api/weather/fetch/{city}",
            name="/api/weather/fetch/[city]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")


class ChatAPIUser(FastHttpUser):
    """
    User that primarily interacts with Chat API endpoints.
    """
    wait_time = between(1, 2)
    
    def on_start(self):
        """Initialize user - create a group if needed"""
        # Try to create a group
        group_name = f"TestGroup_{random.randint(1, 10)}"
        creator = random.choice(USERNAMES)
        
        response = self.client.post(
            "/api/chat/groups",
            json={"groupName": group_name, "creatorUsername": creator},
            name="/api/chat/groups [POST]"
        )
        
        if response.status_code == 201:
            data = response.json()
            if data.get("id") and data["id"] not in GROUP_IDS:
                GROUP_IDS.append(data["id"])
    
    @task(5)
    def get_all_groups(self):
        """Test GET /api/chat/groups endpoint"""
        with self.client.get(
            "/api/chat/groups",
            name="/api/chat/groups [GET]",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(3)
    def get_broadcast_messages(self):
        """Test GET /api/chat/messages/broadcast endpoint"""
        limit = random.choice([10, 25, 50, 100])
        with self.client.get(
            f"/api/chat/messages/broadcast?limit={limit}",
            name="/api/chat/messages/broadcast",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(3)
    def get_private_messages(self):
        """Test GET /api/chat/messages/private endpoint"""
        username1 = random.choice(USERNAMES)
        username2 = random.choice([u for u in USERNAMES if u != username1])
        limit = random.choice([10, 25, 50])
        
        with self.client.get(
            f"/api/chat/messages/private?username1={username1}&username2={username2}&limit={limit}",
            name="/api/chat/messages/private",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
    
    @task(2)
    def get_group_messages(self):
        """Test GET /api/chat/messages/group/:groupId endpoint"""
        if GROUP_IDS:
            group_id = random.choice(GROUP_IDS)
            limit = random.choice([10, 25, 50])

            with self.client.get(
                f"/api/chat/messages/group/{group_id}?limit={limit}",
                name="/api/chat/messages/group/[groupId]",
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    response.success()
                else:
                    response.failure(f"Failed with status {response.status_code}")


class HealthCheckUser(FastHttpUser):
    """
    User that checks health endpoint.
    """
    wait_time = between(5, 10)  # Less frequent

    @task(1)
    def health_check(self):
        """Test GET /api/health endpoint"""
        with self.client.get(
            "/api/health",
            name="/api/health",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed with status {response.status_code}")


class MixedUser(FastHttpUser):
    """
    User that performs a mix of all operations to simulate real-world usage.
    """
    wait_time = between(1, 3)

    @task(15)
    def get_current_weather(self):
        """Most common: Get current weather"""
        city = random.choice(CITIES)
        self.client.get(
            f"/api/weather/current/{city}",
            name="/api/weather/current/[city]"
        )

    @task(5)
    def get_weather_history(self):
        """Get weather history"""
        city = random.choice(CITIES)
        page = random.randint(1, 3)
        self.client.get(
            f"/api/weather/history/{city}?page={page}&pageSize=20",
            name="/api/weather/history/[city]"
        )

    @task(3)
    def get_chat_groups(self):
        """Get all chat groups"""
        self.client.get("/api/chat/groups", name="/api/chat/groups [GET]")

    @task(2)
    def get_broadcast_messages(self):
        """Get broadcast messages"""
        self.client.get(
            "/api/chat/messages/broadcast?limit=50",
            name="/api/chat/messages/broadcast"
        )

    @task(1)
    def health_check(self):
        """Occasional health check"""
        self.client.get("/api/health", name="/api/health")


# Event listeners for custom metrics
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when the test starts"""
    print("\n" + "="*80)
    print("🚀 Starting Load Test for Backend Test Project")
    print("="*80)
    print("\n📊 Performance Targets:")
    print("  - API Response Time: <100ms (p95)")
    print("  - Cache Hit Rate: >90%")
    print("  - Database Query Time: <50ms (p95)")
    print("  - WebSocket Latency: <50ms")
    print("\n" + "="*80 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when the test stops"""
    print("\n" + "="*80)
    print("✅ Load Test Completed")
    print("="*80)
    print("\n📈 Check the Locust web UI for detailed statistics")
    print("🎯 Compare p95 response times against targets:")
    print("  - Weather endpoints should be <100ms (p95)")
    print("  - Chat endpoints should be <100ms (p95)")
    print("  - Health check should be <100ms (p95)")
    print("\n💡 Tips:")
    print("  - Check Redis cache hit rate in application logs")
    print("  - Monitor database query times in application logs")
    print("  - For WebSocket testing, use the test-chat-client.html")
    print("\n" + "="*80 + "\n")

