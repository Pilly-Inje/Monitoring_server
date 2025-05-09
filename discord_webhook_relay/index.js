const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

app.post('/', async (req, res) => {
  try {
    const alerts = req.body.alerts.map(alert => {
      return `🚨 **[${alert.status.toUpperCase()}] ${alert.labels.alertname}**
> ${alert.annotations.description || alert.annotations.summary || 'No description provided.'}`;
    });

    const message = {
      content: alerts.join('\n\n')
    };

    await axios.post(DISCORD_WEBHOOK_URL, message);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error sending to Discord:', err.message);
    res.status(500).send('Failed to send to Discord');
  }
});

const PORT = process.env.PORT || 9094;
app.listen(PORT, () => {
  console.log(`🚀 Discord relay listening on ${PORT}`);
});
