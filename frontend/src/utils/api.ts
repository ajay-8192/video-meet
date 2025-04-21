type BodyType = {
    [key: string]: any;
}

async function beamItUp(url: string, body: BodyType) {

    const strBody = JSON.stringify(body);
    
    const opts = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: strBody,
        credentials: "include"
    }

    const response = await fetch(url, opts as RequestInit);
    const data = await response.json();
    return data;
}

export {
    beamItUp
}
