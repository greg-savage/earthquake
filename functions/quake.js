exports.handler = function(context, event, callback) {
    const axios = require('axios');

    let dataset = 'us-zip-code-latitude-and-longitude'
    async function getZipInfo(zipCode) {
        let url = `https://public.opendatasoft.com/api/records/1.0/search?dataset=${dataset}&q=${zipCode}`
        return axios.get(url).then(response => response.data)
    }

    async function getEarthquakes(starttime,lat,long) {
        const params = new URLSearchParams([
            ['starttime', starttime],
            ['latitude',lat],
            ['longitude',long],
            ['format','geojson'],
            ['maxradiuskm','160.934']
        ]);
        let url = 'https://earthquake.usgs.gov/fdsnws/event/1/query'    
        return axios.get(url,{params}).then(response => response.data)
    }
    function messageResponse(message){
        let twiml = new Twilio.twiml.MessagingResponse()
        twiml.message(message)
        return callback(null, twiml)
    }

    async function earthquakes(zipCode){
        console.log(`ZipCode: ${zipCode}`)
        let zipCoords = await getZipInfo(zipCode);
        let long = zipCoords['records'][0]['fields']['longitude']
        let lat = zipCoords['records'][0]['fields']['latitude']

        let duration = 15
        let date = new Date()
        let endDate = date.setMinutes(date.getMinutes() - duration);
        let date1 = new Date(endDate)
        let dateIso = date1.toISOString();


        let earthquake = await getEarthquakes(dateIso,lat,long)
        console.log(earthquake)
        if (earthquake['metadata']['count'] == 0){
            let url = "https://earthquake.usgs.gov/earthquakes/map"
            let message = `There have been 0 earthquakes within 100 miles in the last ${duration} minutes.\nExplore Older Quakes here: ${url}`
            console.log(message)
            messageResponse(message)
        }
        else {
            let place = earthquake['features'][0]['properties']['place']
            let mag = earthquake['features'][0]['properties']['mag']
            let url = earthquake['features'][0]['properties']['url']
            let message = `Last Earthquake within 100 Miles\nLocation: ${place} \nMagnitude: ${mag}\nInfo: ${url}`
            console.log(message)
            messageResponse(message)
        }
    };
    earthquakes(event.Body)
};
    