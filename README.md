# dimmusaurus
A website for Dimmu Saurus, reincarnation 7.

### Technologies
The goal of this project is a beautiful, small and effective effective website, not contributing to the [Website Obesity Crisis](https://idlewords.com/talks/website_obesity.htm). It looks good and loads fast, both on a powerful PC and a smartphone, and even on an old Nokia phone running Opera Mini.

Hence, no big frameworks or libraries were used, except when they really made difference.

* Frontend
  * Vanilla HTML5
  * Vanilla CSS3 + PureCSS 1.0.1 for (resetting the styles)
  * Vanilla ES2015
* Backend
  * Python 3.8 + Pip
  * Django 3.0.2
  * gettext 0.15 _(required by Django for translations)_
  * python-markdown2 _(you may have it by default)_
  * django-markdown-deux
  * sqlite 3.30.1 _(included with Python)_
* Code style
  * nodejs 12.14+
    * csslint
    * eslint
  * html tidy
  * pycodestyle
* Building
  * nodejs 12.14+
    * babel 7 is used for generating JS for older browsers
    * there is a helper node script for building the legacy CSS.
  * make _(There is a Makefile compatible with `bash`)_

### Development Setup
#### Project overview
 * `build-tools` contains helper scripts needed for building and minifying the code. They are meant to be run by the `Makefile`. Normally, you don't have to modify them.
 * `db` is meant to hold any database backups you make. It is also where the import script looks for files.
 * `img` constains all the images
 * `ui-demo` is the build directory for the demo site. It also servers as temporary directory when building and minifying the code for usage in Django.
 * `src/` contains all the source code, hence all development should happen there. There is a `Makefile` to build the `.css` and `.js`. A list of all `make` commands is available [below](#available-make-commands). You must use the standard `manage.py` that comes with Django to setup and run the website locally. Detailed instructions are available under [Running](#running).
   * `src/js`: contains the javascript source
   * `src/css`: contains the css source
   * `src/py`: contains the Django pr Unrelated tables will not be affected.oject source. `src/py/static` is the default Django static folder and is going to be populated when you build the JS, the CSS and the images using `Makefile`.

#### Linters setup
Linting is meant to be done using globally installed tools. However, depending on your IDE, you may choose to install them locally.

* Install HTML Tidy by the means of your operating system. There are two projects with the same name, but you must use [tidy-html5](https://github.com/htacg/tidy-html5/).
* Install frontend linters:
  * First, you need to install `npm`. Do so by the means of your operating system.
  * `$ npm install -g csslint` (remove `-g` parameter, to install locally)
  * `$ npm install -g eslint` (remove `-g` parameter, to install locally)
* Install Python linter: `$ pip install pycodestyle`

 You might as well install them in the project instead of globally.

#### Frontend setup
* Install npm 12.14+.
* In the main project directory run: `$ npm install`.

#### Python and Django setup
* Install Python 3.8 by the means of your operating system.
* Install Django 3.0
  * Just do: `$ python -m pip install Django==3.0.2`.
  * If you have several Django apps, you'd want to install it in a `virtualenv`. Check out Django docs how to do this.
  * `gettext` is available by default in major Linux distributions, but if you don't have it, or you are using a different OS, you need to install version 0.15 or higher.
* `$ pip install django-markdown-deux`: enables usage of `.md` files as templates.
* `$ pip install markdown2`. Required for converting markdown bits from the database and by `django-markdown-deux`. _(Your Python version may include it by default)_

#### Database setup and management
The project runs on Sqlite3 that comes with Python, so there is no need to install anything extra. Normally, you do not need to open the database at all, as Django and the build-tools take care of it, but should you need to do so, run: `sqlite src/py/db.sqlite3`.

There are `make db-backup` and `make db-import` commands, for exporting and importing the data. They generate and read a `.tar` containing `.csv`, respectively. Each `.csv` inside the tarball corresponds to a database table and is compatible with sqlite3. See more about the make commands [below](#available-make-commands).

**A note on importing backups:** have in mind that exporting appends the current date and time to the filename, however, the import script will _NOT_ accept a file with such name. `make db-import` expects and reads _ONLY_ a `ds.db.tar` file in `db` directory.

**Warning:** `db-import` will truncate each table before importing the corresponding `.csv` data! Tables not matching a `.csv` file, however, will not be affected.

### Running

#### The entire site
* `$ make` - builds and minifies the `css` and the `js`, and copies them and the images to the Django `static` folder.
* `$ cd src/py`
* Open `pysaurus/settings.py` and set `SITE_HOST`, `SITE_PORT`, `ALLOWED_HOSTS` and `BASE_URL` properly.
  * `SITE_HOST` is either an IP address, or a domain name only. No `http(s)://` should be there.
  * `SITE_PORT` is an empty string by default. But if, for example, you choose to run on port 3666, you must change it to: `3666`.
  * `BASE_URL` is used for generating absoulte URLs in templates. Usually, you'd only want to ensure the protocol is correct here.
* `$ django-admin compilemessages` - builds all translations from `.po` files
* `$ python manage.py migrate` - runs database migrations
* `$ python manage.py runserver [a-port-of-your-choice]` - runs the server.

The site will be available on 127.0.0.1:8000, or at the port you have chosen.

#### The UI Demo
* `$ make ui` - builds the `css` and the `js`, and copies the images to `ui-demo` folder.
* `$ cd ui-demo`
* Open the `index.html`

#### Available make commands
In case you need to build only one part of the project, the following commands are available:

Django:
* `$ make clean`: cleans up the Django `static` folder.
* `$ make css-prod`: compiles all css into one file, minifies it, then copies it to the Django `static` folder.
* `$ make js-prod`: same as `make css-dev` but for javascript.
* `$ make pystatic`: Builds both the `css` and the `js`, and copies the images to Django `static` folder, making sure, all resources are ready to use. This is the default `make` target.

UI Demo:
* `$ make clean-ui`: cleans up the `ui-demo/` folder.
* `$ make css-ui`: compiles all css into one file and copies it to the `ui-demo` folder.
* `$ make images`: copies the `images` to `ui-demo/` folder. They don't need building, so they are just copied.
* `$ make js-ui`: same as `make css-ui`, but for JavaScript.
* `$ make ui`: runs all commands to build the frontend demo, including copying the necessary `.html` files.

Database specific commands are:
* `$ make db-backup`: exports the data from all content tables to `.csv` files, one per each table, then packs them in a `.tar`. The resulting tarball will be in `db` directory. Date and time will be appended to the filename, so _**it is safe to run it multiple times**. No backups will be overwritten._
* `$ make db-import`: Looks for a file named `ds.db.tar` in the `db` directory, created using `$ make db-backup` _(Note the tarball filenames!)_. If the file is found, **for each `.csv`** in the tarball, it **truncates the corresponding table** in the database, **then inserts the new data**. Unrelated tables will not be affected.

### Deployment
TODO: Not yet available.
