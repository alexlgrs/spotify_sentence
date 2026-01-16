// import json from './params.json' assert { type: 'json' };
const CLIENT_ID = "4123648a7c4749fca9457174ced2ad02"
const CLIENT_SECRET = "2c092d8609284773a141fdd2973f9acd"

async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    return data.access_token;
}

async function getTrackCover(trackUrl){
    const token = await getAccessToken();

    const response = await fetch(
        //https://embed.spotify.com/oembed/?url=http://open.spotify.com/track/6bc5scNUVa3h76T9nvpGIH
        // `https://embed.spotify.com/oembed/?url=${trackUrl}`
        "https://open.spotify.com/track/5aspFJNTT2prR3NMm2IVUH"
    );

    response.addHeader("Access-Control-Allow-Origin", "http://open.spotify.com");


    const data = await response.json();
    return data;
}


async function searchTrack(trackName) {
    const token = await getAccessToken();

    const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(trackName)}&type=track&limit=50`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    const data = await response.json();
    
    return data.tracks.items;
}


async function get100results(trackName){
    const token = await getAccessToken();

    const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(trackName)}&type=track&limit=50`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    var data1 = await response.json();
    

    const response2 = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(trackName)}&type=track&limit=50&offset=50`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    var data2 = await response2.json();

    return [...data1.tracks.items, ...data2.tracks.items]
}

async function getAlbums(trackName){
    const token = await getAccessToken();

    const response2 = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(trackName)}&type=album&limit=50`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );


    var data2 = await response2.json();
    console.log("données", data2)
    return data2.albums.items
}

async function getArtists(trackName){
    const token = await getAccessToken();

    const response2 = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(trackName)}&type=artist&limit=50`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );


    var data2 = await response2.json();
    console.log("données", data2)
    return data2.artists.items
}



function startResearch(){
    console.log("ici")
    var text = document.getElementById("title_input").value
    console.log("texte " + text)
    
    if(text.length > 0){
        var words = text.split(" ")

        var combinaisons = []

        // Faire que combinaisons ça soit {"Je t'aime": [0,1]} pour dire quels mots il y a dedans
        
        // objectif : faire toutes les combinaisons des mots et les trouver sur spotify
        // for(var i = 0; i < words.length; i++){
        //     if(!combinaisons.includes(words[i])) combinaisons.push(words[i])
        // }

        console.log(combinaisons)
        combinaisons = words

        var idx = 0
        var tracks = []
        let wordIndexes = Array.from({length: words.length}, (_, idx) => -1)

        combinaisons.forEach(async word => {
            var found = false

            const results = await get100results(word)
            const albums = await getAlbums(word)

            results.forEach(track => {
                if(checkSameWord(track.name, word) && !found){
                    found = true
                    tracks.push(track)
                }
            });

            albums.forEach(album => {
                    if(checkSameWord(album.name, word) && !found){
                    found = true
                    tracks.push(album)
                }
            });

            idx++
            if(idx == combinaisons.length) dotherest(tracks)
        });


        function dotherest(tracks){
            document.getElementById("songs").innerHTML = ""

            var i = 0
            console.log(wordIndexes)

            // Faire avec les combinaisons ici et reporter dans wordIndexes 
            tracks.forEach(track => {
                console.log("Track : " + track.name)
                if(track.name) {
                    for(var idx = 0; idx < words.length; idx++){
                        word = words[idx]
                        if(checkSameWord(track.name, word) && wordIndexes[idx] == -1) wordIndexes[idx] = i
                    }

                    i++
                }
            })

            var element = document.createElement("div")
            element.innerHTML = "Liste des tracks : "
            tracks.forEach(track => {element.innerHTML += "\n- " + track.name})

            for(var i = 0; i < wordIndexes.length; i++){
                let wordIndex = wordIndexes[i]


                const track = tracks[wordIndex]

                if(track != undefined){
                    const element = document.createElement("div")

                    var artistNames = ""

                    try {
                        artistNames = track.artists.map(artist => artist.name).join(', ')

                    } catch (error) {
                        artistNames = "-"
                    }

                    element.classList.add("spotify-card")
                    element.innerHTML = `
                        <img src="${track.album != undefined ? track.album.images[0].url : track.images[0].url}" class="cover-art">
                        <div class="card-content">
                            <h3 class="track-title">${track.name}</h3>
                            <p class="artist-name">${artistNames}</p>
                            <div class="spotify-brand">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" alt="logo">
                                <span>Spotify</span>
                            </div>
                        </div>
                    `

                    document.getElementById("songs").appendChild(element)
                }
            }
        }
        
    }
}


function checkSameWord(word1, word2){
    if(word1.toLowerCase().trim() == word2.toLowerCase().trim()) return true
    if(word1[word1.length - 1] == "s") return checkSameWord(word1.substring(0, word1.length - 1), word2)
    if(word2[word2.length - 1] == "s") return checkSameWord(word1, word2.substring(0, word2.length - 1))
}