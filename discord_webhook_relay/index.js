const express = require('express');
const axios = require('axios');
const client = require('prom-client');

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;



// 오류 카운터
const errorCounter = new client.Counter({
  name: 'discord_relay_errors_total',
  help: 'Total number of errors sending Discord messages',
});

// POST 요청 처리
app.post('/', async (req, res) => {
  try {
    const alerts = req.body.alerts.map(alert => {
      return `🚨 **[${alert.status.toUpperCase()}] ${alert.labels.alertname}**
> ${alert.annotations.description || alert.annotations.summary || 'No description provided.'}`;
    });

    await axios.post(DISCORD_WEBHOOK_URL, { content: alerts.join('\n\n') });
    res.status(200).send('OK');
  } catch (err) {
    errorCounter.inc();
    console.error('❌ Discord 전송 실패:', err.message);
    res.status(500).send('Failed to send to Discord');
  }
});

client.collectDefaultMetrics(); // 핵심!

const gauge = new client.Gauge({
  name: 'discord_relay_test_metric',
  help: 'A test gauge for discord_relay'
});

gauge.set(42); // 임의 값
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await client.register.metrics();
    res.set('Content-Type', client.register.contentType);
    res.send(metrics);
  } catch (err) {
    console.error('Error exposing metrics:', err);
    res.status(500).send('Error generating metrics');
  }
});

// ✅ 시작 로그
const PORT = process.env.PORT || 9094;
app.listen(PORT, () => {
  console.log(`🚀 Discord relay is running on port ${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
});
