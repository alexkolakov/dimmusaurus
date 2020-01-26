/* eslint no-undef: 0 */
const Player = new class extends UiElement { // eslint-disable-line
	constructor() {
		super();

		this.playlist = [];
		this.currentTrack = -1;

		this.classes = {
			disabled: 'disabled',
			muted: 'fa-volume-mute',
			selected: 'selected',
			unmuted: 'fa-volume-up'
		};

		this.selectors = {
			audio: '.player audio',
			next: '#pl-next',
			player: '.player',
			playhead: '.track-progress-bar .track-progress',
			playlist: '.menu-playlist-wrapper',
			playlistButton: '#pl-playlist-toggle',
			playlistList: '#playlist-list',
			playlistTrackPrefix: '#playlist-track-',
			playlistUnavailableLabel: '#playlist-unavailable-label',
			previous: '#pl-previous',
			progressBar: '.track-progress-bar',
			progressTime: '.player .progress-time',
			totalTime: '.player .total-time',
			trackTitle: '.player .track-title',
			tunePlayButton: '.content-tune .tune-play',
			volume: '.player-controls .volume'
		};

		this._init();
	}

	_init() {
		window.addEventListener('load', () => {
			if (!this._isSupported()) {
				return;
			}

			this._getPlaylist();
			this._show();

			// we need to use addEventListener, because this is the only way of getting mouse coordinates
			if (this.select(this.selectors.progressBar)) {
				this.$element.addEventListener('mouseup', (event) => this.onProgressBarClick(event));
			}

			// toggle playlist both from the button and track title
			this.select(this.selectors.playlistButton).addEventListener('click', (event) => {
				event.stopPropagation();
				this.togglePlaylist();
			});
			// this.select(this.selectors.trackTitle).addEventListener('click', (event) => {
			// 	event.stopPropagation();
			// 	this.togglePlaylist();
			// });
		});
	}


	/**
	 * isSupported
	 * Determines if player will work on this browser.
	 *
	 * @param {void}
	 * @return {Boolean}
	 */
	_isSupported() {
		try {
			const dummyTag = document.createElement('audio');
			const canPlay = dummyTag.canPlayType('audio/ogg; codecs="vorbis"');
			dummyTag.remove();

			return canPlay === 'probably' || canPlay === 'maybe';
		} catch (e) {
			return false;
		}
	}


	/**
	 * show
	 * Show the player and readjust other UI elements for it to fit properly.
	 *
	 * @param void
	 * @return {void}
	 */
	_show() {
		this.select('body').removeClass('unsupported-player');
	}


	/**
	 * toggleMute
	 * Mutes or unmutes player sounds.
	 *
	 * @param {void}
	 * @return {void}
	 */
	toggleMute() {
		this.select(this.selectors.volume);

		if (this.hasClass(this.classes.unmuted)) {
			this.removeClass(this.classes.unmuted);
			this.addClass(this.classes.muted);
			this.addClass(this.classes.disabled);

			console.debug('sounds off');
		} else {
			this.removeClass(this.classes.muted);
			this.removeClass(this.classes.disabled);
			this.addClass(this.classes.unmuted);

			console.debug('sounds on');
		}
	}


	/**
	 * play
	 * Plays the currently selected song.
	 *
	 * @param {void}
	 * @return {void}
	 */
	play() {
		console.debug(`play ${this.currentTrack}`);
	}


	/**
	 * stop
	 * Stops playing the currently selected song.
	 *
	 * @param {void}
	 * @return {void}
	 */
	stop() {
		if (this.currentTrack === -1) {
			Logger.warn('Trying to stop playback, but no track is selected.');
		}
		this.seek(0);
		console.debug(`stop ${this.currentTrack}`);
	}


	/**
	 * next
	 * Jumps to the next song in the playlist
	 *
	 * @param {void}
	 * @return {void}
	 */
	next() {
		this.select(this.selectors.next);
		if (this.hasClass(this.classes.disabled)) {
			return;
		}

		this.selectTrack(this.currentTrack + 1);
		if (this.currentTrack !== -1) {
			this.play();
		}
	}


	/**
	 * previous
	 * Jumps to the previous song in the playlist
	 *
	 * @param {void}
	 * @return {void}
	 */
	previous() {
		this.select(this.selectors.previous);
		if (this.hasClass(this.classes.disabled)) {
			return;
		}

		this.selectTrack(this.currentTrack - 1);
		if (this.currentTrack !== -1) {
			this.play();
		}
	}


	/**
	 * seek
	 * Seeks to a different time point of the currently playing song.
	 *
	 * @param  {number} percent
	 * @return {void}
	 */
	seek(percent) {
		this._movePlayhead(percent);
		this._setPlaybackTime(percent);

		// @todo: seek the audio too
	}


	/**
	 * selectTrack
	 * Finds a given track in the playlist and sets it ready for playing.
	 *
	 * @param  {number} trackId
	 * @return void
	 */
	selectTrack(trackId) {
		if (this.currentTrack === trackId) {
			return;
		}

		if (this.currentTrack !== -1) {
			this.stop();
		}

		const $items = this.selectAll(`[id^='${this.selectors.playlistTrackPrefix.replace('#', '')}']`);
		this.removeClassAll($items, 'selected');
		this.select(this.selectors.trackTitle).setHTML('');
		this.select(this.selectors.totalTime).setHTML('--:--');

		const track = this.playlist[trackId];
		if (!track) {
			this.currentTrack = -1;
			return;
		}

		this.currentTrack = trackId;

		this.select(`${this.selectors.playlistTrackPrefix}${trackId}`).addClass(this.classes.selected);
		this.select(this.selectors.trackTitle).setHTML(track.title);
		this.select(this.selectors.totalTime).setHTML(addLeadingZeros(track.duration));
		this.disableNextWhenLastSong();
		this.disablePreviousWhenFirstSong();
		this.seek(0);
	}


	/**
	 * onProgressBarClick
	 * Detects the click position on the progress bar, calculates the seek percentage from it,
	 * then uses this.seek() to seek the song and update the UI.
	 *
	 *
	 * @param {Event} event
	 * @return {void}
	 */
	onProgressBarClick(event) {
		if (!this.select(this.selectors.progressBar)) {
			return;
		}

		const pbRect = this.$element.getBoundingClientRect();
		const seekTarget = 1 - (pbRect.width - (event.clientX - pbRect.x)) / pbRect.width;

		this.seek(seekTarget * 100);
	}


	/**
	 * _movePlayhead
	 * Moves the HTML playhead element to the desired position.
	 *
	 * @param  {number} percentFromStart
	 * @return {void}
	 */
	_movePlayhead(percentFromStart) {
		if (!this.select(this.selectors.playhead)) {
			return;
		}

		let percent = Number.parseInt(percentFromStart, 10);
		percent = Number.isNaN(percent) ? 0 : percent;

		this.setStyle({ width: `${percent}%` });
	}


	/**
	 * _setPlaybackTime
	 * Updates the HTML element that contains the playback time.
	 *
	 * @param {number} percentFromStart
	 * @return {void}
	 */
	_setPlaybackTime(percentFromStart) {
		const uiTime = this.select(this.selectors.totalTime).getHTML().split(':');
		let totalTime = Number.parseInt(uiTime[1]) + 60 * Number.parseInt(uiTime[0]);
		if (Number.isNaN(totalTime)) {
			Logger.warn('Failed parsing total time while trying to set playback time. Assuming it is 0.');
			totalTime = 0;
		}

		const currentTime = percentFromStart / 100 * totalTime;
		const seconds = Math.floor(currentTime % 60);
		const minutes = Math.floor((currentTime - seconds) / 60);

		this.select(this.selectors.progressTime).setHTML(
			addLeadingZeros(`${minutes}:${seconds}`)
		);
	}


	disableNextWhenLastSong() {
		this.select(this.selectors.next);

		if (this.currentTrack === this.playlist.length - 1) {
			this.addClass(this.classes.disabled);
		} else {
			this.removeClass(this.classes.disabled);
		}
	}


	disablePreviousWhenFirstSong() {
		this.select(this.selectors.previous);

		if (this.currentTrack === 0) {
			this.addClass(this.classes.disabled);
		} else {
			this.removeClass(this.classes.disabled);
		}
	}


	/**
	 * togglePlaylist
	 * Self-explanatory
	 *
	 * @param  {void}
	 * @return {void}
	 */
	togglePlaylist() {
		this.select(this.selectors.playlist).toggleClass(Menu.closedMenuClass); // eslint-disable-line no-undef
	}


	/**
	 * _getPlaylist
	 * Fetches the playlist from the backend and displays if there were no errors.
	 * In case there were, it will enable the "Playlist unavailable" message.
	 *
	 * @return {void}
	 */
	_getPlaylist() {
		axios.get('/api/music/playlist/')
			.then(data => {
				this.playlist = [];
				let track = -1;
				if (data && data.data && data.data.playlist && Array.isArray(data.data.playlist)) {
					this.playlist = data.data.playlist.reverse();
					this._displayPlaylist(this.playlist);
					track = 0;
				}
				this.selectTrack(track);
			})
			.catch(error => {
				Logger.error(`Failed fetching the playlist. ${error}.`);
				this._displayPlaylist([]);
			});
	}


	/**
	 * _displayPlaylist
	 * Builds the playlist HTML and injects it into the page.
	 *
	 * @param  {{ id: number, title: string, duration: string, files: {file_type, file_name}[] }[]} playlist
	 * @return {void}
	 */
	_displayPlaylist(playlist) {
		if (!playlist || !playlist.length) {
			Logger.warn('Displaying empty playlist.');

			this.select(this.selectors.playlist).addClass('playlist-unavailable');
		}

		this.select(this.selectors.playlist).removeClass('playlist-unavailable');

		let playlistTemplate = '';
		playlist.forEach((item, index) => {
			playlistTemplate += getPlaylistItemTemplate(
				index,
				item.title,
				item.duration,
				this.selectors.playlistTrackPrefix
			);
		});

		this.select(this.selectors.playlistList).setHTML(playlistTemplate);
	}
};
