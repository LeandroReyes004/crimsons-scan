const terminal = document.getElementById('terminal');

function appendLog(text) {
    const div = document.createElement('div');
    // Basic text formatting for HTML terminal
    div.innerHTML = text.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
}

const eventSource = new EventSource('/api/logs');

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    appendLog(data.text);
};

eventSource.onerror = function() {
    console.error('Error connecting to SSE');
};

async function startBackup(type) {
    try {
        const response = await fetch(`/api/backup/${type}`, {
            method: 'POST'
        });
        if (!response.ok) {
            appendLog(`[ERROR] Falló la petición HTTP para ${type}.`);
        }
    } catch (error) {
        appendLog(`[ERROR] ${error.message}`);
    }
}
