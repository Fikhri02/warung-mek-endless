// GitHub Pages caps files at 100 MB, so index.pck ships as parts; stitch them back into one stream.
(function () {
	const parts = ['index.pck.part0', 'index.pck.part1', 'index.pck.part2', 'index.pck.part3', 'index.pck.part4'];
	const realFetch = window.fetch.bind(window);
	window.fetch = function (input, init) {
		const url = typeof input === 'string' ? input : input.url;
		if (!/(^|\/)index\.pck(\?|$)/.test(url)) {
			return realFetch(input, init);
		}
		let i = 0;
		let reader = null;
		const body = new ReadableStream({
			async pull(controller) {
				for (;;) {
					if (!reader) {
						if (i >= parts.length) {
							controller.close();
							return;
						}
						const r = await realFetch(parts[i++]);
						if (!r.ok) {
							throw new Error(`Failed loading file '${parts[i - 1]}'`);
						}
						reader = r.body.getReader();
					}
					const { done, value } = await reader.read();
					if (done) {
						reader = null;
						continue;
					}
					controller.enqueue(value);
					return;
				}
			},
		});
		return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } }));
	};
})();
