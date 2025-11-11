# Load Testing dengan Locust

Panduan untuk melakukan load testing pada Backend Test Project menggunakan Locust.

## 📋 Prerequisites

1. **Python 3.8+** harus terinstall
2. **Backend application** harus berjalan di `http://localhost:3000`
3. **Database dan Redis** harus aktif (via Docker Compose)

## 🚀 Setup

### 1. Install Locust

```bash
# Install dependencies
pip install -r requirements-locust.txt

# Atau install langsung
pip install locust
```

### 2. Pastikan Backend Berjalan

```bash
# Start Docker services (PostgreSQL & Redis)
docker-compose up -d

# Start backend application
npm run start:dev
```

### 3. Populate Data (Opsional tapi Disarankan)

Untuk hasil testing yang lebih akurat, populate data terlebih dahulu:

```bash
# Fetch weather data untuk beberapa kota
curl -X POST http://localhost:3000/api/weather/fetch/Jakarta
curl -X POST http://localhost:3000/api/weather/fetch/Bandung
curl -X POST http://localhost:3000/api/weather/fetch/Surabaya
curl -X POST http://localhost:3000/api/weather/fetch/Medan
curl -X POST http://localhost:3000/api/weather/fetch/Semarang
```

## 🧪 Menjalankan Load Test

### Mode 1: Web UI (Recommended)

```bash
# Start Locust dengan Web UI
locust -f locustfile.py --host=http://localhost:3000

# Atau dengan custom port
locust -f locustfile.py --host=http://localhost:3000 --web-port=8089
```

Kemudian buka browser ke `http://localhost:8089` dan:
1. Set **Number of users**: 50-100 (untuk simulasi traffic normal)
2. Set **Spawn rate**: 10 (users per second)
3. Klik **Start swarming**

### Mode 2: Headless (Command Line)

```bash
# Run dengan 100 users, spawn rate 10/s, durasi 5 menit
locust -f locustfile.py --host=http://localhost:3000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --headless

# Dengan HTML report
locust -f locustfile.py --host=http://localhost:3000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --headless \
  --html report.html
```

## 📊 Skenario Testing

File `locustfile.py` mencakup beberapa user class:

### 1. **WeatherAPIUser**
- Fokus pada Weather API endpoints
- Task weights:
  - `GET /api/weather/current/:city` (weight: 10) - Most frequent
  - `GET /api/weather/history/:city` (weight: 3)
  - `POST /api/weather/fetch/:city` (weight: 1)

### 2. **ChatAPIUser**
- Fokus pada Chat API endpoints
- Task weights:
  - `GET /api/chat/groups` (weight: 5)
  - `GET /api/chat/messages/broadcast` (weight: 3)
  - `GET /api/chat/messages/private` (weight: 3)
  - `GET /api/chat/messages/group/:groupId` (weight: 2)

### 3. **HealthCheckUser**
- Periodic health checks
- Lower frequency (wait time: 5-10s)

### 4. **MixedUser**
- Simulasi real-world usage
- Mix dari semua operasi

## 🎯 Target Performance

Berdasarkan README, target performance yang harus dicapai:

| Metric | Target | Cara Validasi |
|--------|--------|---------------|
| API Response Time (p95) | <100ms | Lihat di Locust UI kolom "95%ile" |
| Cache Hit Rate | >90% | Check application logs |
| Database Query Time (p95) | <50ms | Check application logs |
| WebSocket Latency | <50ms | Test manual dengan test-chat-client.html |

## 📈 Membaca Hasil Test

### Di Locust Web UI:

1. **Statistics Tab**:
   - Perhatikan kolom **"95%ile"** - harus <100ms untuk semua endpoints
   - **"Failures"** - harus 0% atau minimal
   - **"RPS"** (Requests per second) - throughput aplikasi

2. **Charts Tab**:
   - **Total Requests per Second** - trend throughput
   - **Response Times (ms)** - trend latency
   - **Number of Users** - jumlah concurrent users

3. **Failures Tab**:
   - Jika ada error, akan muncul di sini dengan detail

### Contoh Output yang Baik:

```
Type     Name                              # reqs    # fails  Avg    Min    Max    95%ile  RPS
------------------------------------------------------------------------
GET      /api/weather/current/[city]       10000     0        45     12     156    78      167
GET      /api/weather/history/[city]       3000      0        62     18     189    95      50
POST     /api/weather/fetch/[city]         1000      0        85     45     234    145     17
GET      /api/chat/groups [GET]            5000      0        38     10     142    72      83
GET      /api/health                       500       0        15     5      45     28      8
```

## 🔥 Stress Testing

Untuk test dengan traffic tinggi (1M requests/day ≈ 12 req/s average):

```bash
# Simulate peak load (5-10x average = 60-120 req/s)
locust -f locustfile.py --host=http://localhost:3000 \
  --users 200 \
  --spawn-rate 20 \
  --run-time 10m \
  --headless
```

## 💡 Tips

1. **Warm up cache**: Jalankan test ringan dulu (10-20 users) selama 1-2 menit
2. **Monitor resources**: Gunakan `docker stats` untuk monitor CPU/Memory
3. **Check logs**: Monitor application logs untuk cache hit rate dan query times
4. **Incremental load**: Mulai dari users kecil, naikkan bertahap
5. **Multiple runs**: Jalankan test beberapa kali untuk hasil yang konsisten

## 🐛 Troubleshooting

### Connection Refused
```bash
# Pastikan backend running
curl http://localhost:3000/api/health
```

### High Failure Rate
- Check backend logs untuk errors
- Pastikan database dan Redis running
- Reduce number of users

### Slow Response Times
- Check if data exists (run fetch endpoints first)
- Monitor database and Redis performance
- Check if cache is working (should see faster responses on repeated requests)

## 📝 Custom Testing

Untuk test endpoint spesifik, edit `locustfile.py` dan adjust task weights atau buat user class baru.

Contoh test hanya weather endpoints:
```bash
locust -f locustfile.py --host=http://localhost:3000 WeatherAPIUser
```

## 🎓 Resources

- [Locust Documentation](https://docs.locust.io/)
- [Writing Locustfiles](https://docs.locust.io/en/stable/writing-a-locustfile.html)
- [Distributed Load Testing](https://docs.locust.io/en/stable/running-distributed.html)

