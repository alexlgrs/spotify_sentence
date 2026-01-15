
const CLIENT_ID = '4123648a7c4749fca9457174ced2ad02';
const CLIENT_SECRET = '2c092d8609284773a141fdd2973f9acd';
// rempalcer par les trucs du dotenv
require('dotenv').config({path: __dirname + '/.env'})

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

function startResearch(){
    console.log("ici")
    var text = document.getElementById("title_input").value
    console.log("texte " + text)
    
    if(text.length > 0){
        var words = text.split(" ")

        var combinaisons = []
        // objectif : faire toutes les combinaisons des mots et les trouver sur spotify
        for(var i = 0; i < words.length; i++){
            if(!combinaisons.includes(words[i])) combinaisons.push(words[i])
            for(var j = i; j < words.length; j++){
                // Faire une recherche spotify avec le words[i] + tous les words[j]
                let new_combinaison = ""
                
                for(var k = j; k < words.length; k++){
                    new_combinaison += words[k] + " "
                }

                console.log("Ajout de la combinaison : " + new_combinaison)
                
                if(!combinaisons.includes(new_combinaison.trim())) combinaisons.push(new_combinaison.trim())
            }
        }

        console.log(combinaisons)
        var idx = 0
        var tracks = []
        let wordIndexes = Array.from({length: words.length}, (_, idx) => -1)

        combinaisons.forEach(async word => {
            var found = false

            const results = await get100results(word)

            results.forEach(track => {

                // console.log({
                //     title: track.name,
                //     artist: track.artists.map(a => a.name).join(', '),
                //     album: track.album.name,
                // });

                if(checkSameWord(track.name, word) && !found){
                    found = true
                    var element = document.createElement("div") 
                    element.innerHTML = track.name + " par " + track.artists.map(a => a.name).join(', ')
                    // document.getElementById("songs").appendChild(element)
                    tracks.push(track)
                }
            });

            idx++
            if(idx == combinaisons.length) dotherest(tracks)
        });


        function dotherest(tracks){
            document.getElementById("songs").innerHTML = ""
            // stocker quels mots de la phrase sont pris en compte dans quel titre
            var i = 0
            console.log(wordIndexes)
            tracks.forEach(track => {
                console.log("TRACKKKKKK", track)
                if(track.name) {
                    words.forEach(word => {
                        if(checkSameWord(track.name, word) && wordIndexes[words.indexOf(word)] == -1) wordIndexes[words.indexOf(word)] = i
                    });
                    i++
                }
                // pour chaque mot, regarder dans quel tracks il est 
                // et mettre l'index de la track a sa place dans wordIndexes
                
            })

            var element = document.createElement("div")
            element.innerHTML = "Liste des tracks : "
            tracks.forEach(track => {element.innerHTML += "\n- " + track.name})
            // document.getElementById("songs").appendChild(element)

            for(var i = 0; i < wordIndexes.length; i++){
                let wordIndex = wordIndexes[i]
                const track = tracks[wordIndex];
                if(track != undefined){
                    const element = document.createElement("div");

                    var artistNames = ""

                    try {
                        artistNames = track.artists.map(artist => artist.name).join(', ');

                    } catch (error) {
                        artistNames = "-"
                    }

                    element.classList.add("spotify-card")
                    element.innerHTML = `
                        <img src="${track.album.images[0].url}" class="cover-art">
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
    // if(word2[    word2.length - 1] != "s") console.log("ya un s a la fin de " + word2 + " : " + word2[word2.length - 1])
    if(word1.toLowerCase().trim() == word2.toLowerCase().trim()) return true
    if(word1[word1.length - 1] == "s") return checkSameWord(word1.substring(0, word1.length - 1), word2)
    if(word2[word2.length - 1] == "s") return checkSameWord(word1, word2.substring(0, word2.length - 1))
}