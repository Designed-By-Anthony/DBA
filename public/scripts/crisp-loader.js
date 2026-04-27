(() => {
	function loadCrisp() {
		if (window.__dbaCrispLoaded) return;
		window.__dbaCrispLoaded = true;
		window.$crisp = window.$crisp || [];
		window.CRISP_RUNTIME_CONFIG = Object.assign({}, window.CRISP_RUNTIME_CONFIG, {
			locale: "en",
		});
		window.CRISP_WEBSITE_ID = "427bf1d5-f2a9-408b-8cc6-0efc6489c676";
		const d = document;
		const s = d.createElement("script");
		s.src = "https://client.crisp.chat/l.js";
		s.async = true;
		d.getElementsByTagName("head")[0]?.appendChild(s);
	}

	const kickoff = () => {
		loadCrisp();
		window.removeEventListener("pointerdown", kickoff);
		window.removeEventListener("keydown", kickoff);
	};

	window.addEventListener("pointerdown", kickoff, {
		once: true,
		passive: true,
	});
	window.addEventListener("keydown", kickoff, { once: true });
	window.setTimeout(loadCrisp, 6000);
})();
