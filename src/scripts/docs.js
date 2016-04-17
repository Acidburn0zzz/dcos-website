(function() {

  // Search
  const version = 'latest';

  let debounce = function (fn) {
    let timeout;
    return function () {
      let args  = Array.prototype.slice.call(arguments);
      let ctx   = this;

      clearTimeout(timeout)
      timeout = setTimeout(() => { fn.apply(ctx, args) }, 100)
    }
  }

  const searchInput = $('.docs-search__input');
  searchInput.setAttribute('disabled', 'disabled');

  fetch(`/docs/${version}/lunr.json`)
    .then(response => response.text())
    .then(body => {
      searchInput.removeAttribute('disabled');
      const idx = lunr.Index.load(JSON.parse(body));

      let stripExtname = function(filePath) {
        if(filePath.substr(filePath.length-10, filePath.length) === 'index.html') return filePath.substr(0, filePath.length-10);
        return filePath.substr(filePath.length-5, filePath.length) === '.html' ? filePath.substr(0, filePath.length-5) : filePath;
      }

      searchInput.addEventListener('keyup', debounce(function (event) {
        var query = searchInput.value;
        if (query < 2) {
          $('.docs-layout__docs-results').setAttribute('style', 'display: none;');
          $('.docs-layout__docs-article').removeAttribute('style');
          return;
        };

        let results = idx.search(query).map(result => {
          let doc;
          let ref = result.ref;

          let findDoc = function(q) {
            if(q.path === ref) doc = {doc: q, result: result};
            if(q.children.length) q.children.forEach(findDoc);
          }

          __dcos_docs.forEach(findDoc);

          return doc;
        });

        $('.docs-layout__docs-results').removeAttribute('style');
        $('.docs-layout__docs-article').setAttribute('style', 'display: none;');

        if(results.length) {
          $('.docs-layout__docs-content').innerHTML = results.sort((a, b) => { return b.result.score - a.result.score }).map(result => {
            if(!result) return;
            return `
              <div class='search-result'>
                <a class='results-title' href='/docs/latest/${stripExtname(result.doc.path)}'>${result.doc.file.post_title}</a>
                <p class='results-snippet'>${result.doc.file.search_blurb}</p>
              </div>
            `;
          }).join('\n');
        } else {
          $('.docs-layout__docs-content').innerHTML = `
            <article><p>Sorry, no results found for your search query. Try searching for something else.</p></article>
          `;
        }

      }));
    });


  // Navigation
  Array.prototype.forEach.call($$('.docs-nav__item_folder a'), el => {
    el.addEventListener('click', function(e) {
      if(e.currentTarget.hasClassName('docs-nav__item__arrow')) e.preventDefault();
      else if(!e.currentTarget.getAttribute('data-path')) return;
      let parent = e.currentTarget.parentNode.parentNode;
      let img = e.currentTarget.querySelector('img');

      parent.hasClassName('docs-nav__item--closed') ? parent.removeClassName('docs-nav__item--closed') : parent.addClassName('docs-nav__item--closed')
      if(parent.hasClassName('docs-nav__item--closed')) {
        parent.querySelector('.docs-nav__item__title').hasClassName('active') ? img.setAttribute('src', '/assets/images/icons/arrow-right-docs-selected.svg') : img.setAttribute('src', '/assets/images/icons/arrow-right-docs.svg');
      } else {
        parent.querySelector('.docs-nav__item__title').hasClassName('active') ? img.setAttribute('src', '/assets/images/icons/arrow-down-docs.svg') : img.setAttribute('src', '/assets/images/icons/arrow-down-docs-unselected.svg');
      }

      Stickyfill.rebuild();
    });
  });

  // Sticky sidebar
  const docsSidebar = $('.docs-layout__docs-nav');

  addRemoveSticky();

  window.addEventListener('resize', addRemoveSticky, true);

  function addRemoveSticky () {
    if (window.innerWidth < 768) Stickyfill.remove($('.docs-layout__docs-nav'));
    else Stickyfill.add($('.docs-layout__docs-nav'));
  }

  // Highlight.js
  Array.prototype.forEach.call($$('pre code'), el => {
    hljs.highlightBlock(el);
  });

  // Feedback
  Array.prototype.forEach.call($$('#submit-feedback'), el => {
    el.href = `https://github.com/dcos/dcos-docs/issues/new?body=${encodeURI(window.location.href)}`;
  });

})()
