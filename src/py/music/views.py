from os import path
from django.conf import settings
from django.http import Http404, HttpResponseRedirect, HttpResponse
from django.shortcuts import render, get_object_or_404
from django.utils.translation import gettext, activate, get_language

from .models import SongDescription, SongFile, SongLyrics
from .shortcuts import get_music_menu_album_list


def render_albums(request, album_id=None):
    lang = get_language()

    albums = get_music_menu_album_list(lang)
    songs = SongDescription.objects.select_related('song').filter(language=lang)
    songs = songs.order_by('song__album_order', 'song__release_date')
    songs = songs.only(
        'song__id',
        'song__album_id',
        'song__original_title',
        'song__length',
        'song__slug',
        'title'
    )

    if album_id:
        selected_album = get_object_or_404(albums, album__id=album_id)

        context = {
            'albums': albums,
            'song_descriptions': songs,
            'page_albums': [selected_album],
            'page': {
                'base_url': 'http://%s%s' % (settings.SITE_HOST, settings.SITE_PORT),
                'url': 'music/albums/',
                'url_slug': selected_album.album_id,
                'url_slug_operation': '/switch_language/',
                'title': selected_album.title,
                'description': '%s. %s' % (selected_album.title, gettext('Track list and information.')),
                'single_album': True,
            }
        }
    else:
        context = {
            'albums': albums,
            'song_descriptions': songs,
            'page_albums': albums,
            'page': {
                'url': 'music/',
                # Translators: Discography page title
                'title': gettext('Discography'),
                # Translators: Discography page description
                'description': gettext('Dimmu Saurus Discography'),
            }
        }

    response = render(request, 'music/discography.html', context)

    response.set_cookie(settings.LANGUAGE_COOKIE_NAME, lang)
    return response


def render_song(request, song_id):
    lang = get_language()

    song_description = get_object_or_404(
        SongDescription.objects.select_related('song', 'song__album').filter(language=lang),
        song__id=song_id
    )
    song = song_description.song
    if song.is_hidden:
        raise Http404

    song_album = get_object_or_404(
        song.album.album_details.only('album_id', 'slug', 'title'),
        language=lang
    )

    song_title = song_description.translated_title
    context = {
        'albums': get_music_menu_album_list(lang),
        'song': song,
        'song_album': song_album,
        'song_description': song_description,
        'song_title': song_title,
        'page': {
                'base_url': 'http://%s%s' % (settings.SITE_HOST, settings.SITE_PORT),
                'url': 'music/songs/',
                # we can't use absolute_url here, because translations won't work
                'url_slug': '%d-%s' % (song.id, song.slug),
                # Translators: Song page title
                'title': '%s | %s' % (song_title, gettext('Song Details')),
                # Translators: Song page description
                'description': '%s. %s' % (song_title, gettext('Detailed information and song lyrics. Download link.')),
            }
    }

    response = render(request, 'music/song.html', context)
    response.set_cookie(settings.LANGUAGE_COOKIE_NAME, lang)
    return response


def render_lyrics(request, song_id):
    lang = get_language()

    lyrics = get_object_or_404(SongLyrics.objects.select_related('song', 'song__album'), song__id=song_id)
    this_album = get_object_or_404(
        lyrics.song.album.album_details.only('album_id', 'slug', 'title'),
        language=lang
    )
    this_song_title = get_object_or_404(
        lyrics.song.song_descriptions.only('title', 'song__original_title'),
        language=lang
    ).translated_title

    context = {
        'albums': get_music_menu_album_list(lang),
        'lyrics': lyrics,
        'song_title': this_song_title,
        'album': this_album,
        'page': {
                'base_url': 'http://%s%s' % (settings.SITE_HOST, settings.SITE_PORT),
                'url': 'music/songs/',
                # we can't use absolute_url here, because translations won't work
                'url_slug': '%d-%s' % (lyrics.song.id, lyrics.song.slug),
                'url_slug_operation': '/lyrics/',
                # Translators: Lyrics page title
                'title': '%s | %s' % (this_song_title, gettext('Lyrics')),
                # Translators: Lyrics page description
                'description': '%s. %s' % (this_song_title, gettext('Song lyrics and English translation.')),
            }
    }

    response = render(request, 'music/lyrics.html', context)

    response.set_cookie(settings.LANGUAGE_COOKIE_NAME, lang)
    return response


def random_invalid_route(request):
    browser_language = getattr(request, 'LANGUAGE_CODE', settings.LANGUAGE_CODE)
    if browser_language == 'bg':
        redirect = HttpResponseRedirect('/музика/')
    elif browser_language == 'fr':
        redirect = HttpResponseRedirect('/musique/')
    else:
        redirect = HttpResponseRedirect('/music/')

    redirect.status_code = 301
    return redirect


def download(request, song_id):
    file = get_object_or_404(
        SongFile.objects.select_related('song').only('song__slug', 'file_name', 'file_type'),
        song_id=song_id
    )

    try:
        file_size = path.getsize(file.get_absolute_path())
        file_contents = open(file.get_absolute_path(), 'rb').read()
    except OSError as e:
        raise Http404

    response = HttpResponse(file_contents)
    if file.file_type == 'ogg' or file.file_type == 'opus':
        response['Content-Type'] = 'audio/ogg'
    elif file.file_type == 'aac':
        response['Content-Type'] = 'audio/mp4'
    else:
        response['Content-Type'] = 'application/octet-stream'
    response['Content-Disposition'] = 'attachment; filename=%s.%s' % (file.song.slug, file.file_type)
    response['Content-Length'] = file_size

    return response


# ######### All Albums Overview ######### #
def дискография(request):
    activate('bg')
    return render_albums(request)


def discography(request):
    activate('en')
    return render_albums(request)


def discographie(request):
    activate('fr')
    return render_albums(request)


# ######### Single Album View ######### #
def албум(request, album_id):
    activate('bg')
    return render_albums(request, album_id)


def album_en(request, album_id):
    activate('en')
    return render_albums(request, album_id)


def album_fr(request, album_id):
    activate('fr')
    return render_albums(request, album_id)


# ######### Song View ######### #
def песен(request, song_id):
    activate('bg')
    return render_song(request, song_id)


def song(request, song_id):
    activate('en')
    return render_song(request, song_id)


def chanson(request, song_id):
    activate('fr')
    return render_song(request, song_id)


# ######### Lyrics View ######### #
def текст(request, song_id):
    activate('bg')
    return render_lyrics(request, song_id)


def lyrics(request, song_id):
    activate('en')
    return render_lyrics(request, song_id)


def paroles(request, song_id):
    activate('fr')
    return render_lyrics(request, song_id)
