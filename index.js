async function getAlbums(username) {
	const url = new URL("https://ws.audioscrobbler.com/2.0/");
	const params = new URLSearchParams({
		method: "user.getrecenttracks",
		user: username,
		limit: "1",
		api_key: "0a828de6701971f3766542996b54c24b", //important note: this isn't my api key, so don't worry about it being exposed
		format: "json",
	});
	url.search = params.toString();
	const json = await fetch(url).then((res) => res.json());
	console.log(JSON.stringify(json));
	const track = json.recenttracks.track[0];
	return track.image[3]["#text"];
	// return JSON.stringify({
	//   title: track.name,
	//   artist: track.artist["#text"],
	//   img: track.image[3]["#text"],
	//   album: track.album["#text"],
	// });
}

addEventListener("fetch", (event) => {
	return event.respondWith(httpRequest(event.request.url));
});
async function httpRequest(url) {
	const entries = url.split("/");
	if (entries.length !== 4) {
		return new Response("<h1>Please add a username to the url</h1>");
	}
	return Response.redirect(await getAlbums(entries[entries.length - 1]), 302);
}
