async function getAlbums(username) {
	const url = new URL("https://ws.audioscrobbler.com/2.0/");
	const params = new URLSearchParams({
		method: "user.getrecenttracks",
		user: username,
		limit: 1,
		api_key: "0a828de6701971f3766542996b54c24b",
		format: "json",
	});
	url.search = params.toString();

	const json = await fetch(url).then((res) => res.json());
	console.log(json);
	const tracks = json.recenttracks.track;

	let track = tracks[0];
	return {
		title: track.name,
		artist: track.artist.name,
		// playcount: track.playcount,
		src: track.image[3]["#text"],
	};
}

addEventListener("fetch", (event) => {
	return event.respondWith(httpRequest(event.request.url));
});

async function httpRequest(url) {
	const entries = url.split("/");

	return new Response(await getAlbums(entries[entries.length - 1]));
}
