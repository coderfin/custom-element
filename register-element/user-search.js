// https://benmccormick.org/2014/08/28/custom-elements-by-example/

let searchElement = document.querySelector("user-search");

document.querySelector("input").addEventListener("keyup", (event) => {
    searchElement.setAttribute("name", event.target.value);
});

let users = null;
let getUsers = () => {
    return new Promise((resolve, reject) => {
        if (users) {
            resolve(users);
        }

        fetch("https://jsonplaceholder.typicode.com/users")
            .then(response => response.json())
            .then(usersJson => {
                users = usersJson;

                resolve(users);
            });
    });
};

let clearShadowRoot = (container) => {
    if (container.shadowRoot) {
        container.shadowRoot.textContent = "";
    }
};

// http://stackoverflow.com/a/38694640/2344083
let filterTextByTerms = (text, searchTerms) => {
    let regexStr = `(?=.*${searchTerms.join(")(?=.*")})`;
    let searchRegEx = new RegExp(regexStr, "gi");

    return text.match(searchRegEx) !== null;
};

let populateWithResults = (searchName, container) => {
    searchName = searchName.trim();

    if (searchName) {
        getUsers()
            .then(users => {
                let searchTerms = searchName.toLowerCase().split(/[^A-Za-z]/);

                let searchResults = users.filter(user => filterTextByTerms(user.name.toLowerCase(), searchTerms));

                let shadow;
                if (container.shadowRoot) {
                    clearShadowRoot(container);
                    shadow = container.shadowRoot;
                } else {
                    shadow = container.attachShadow({
                        mode: "open" // https://hayato.io/2016/shadowdomv1/#a-closed-shadow-root
                    });
                }

                let ul = document.createElement("ul");

                searchResults.forEach(searchResult => {
                    let li = document.createElement("li");
                    li.textContent = searchResult.name;

                    ul.appendChild(li);
                });

                shadow.appendChild(ul);
            });
    } else {
        clearShadowRoot(container);
    }
};

//------------------------------------------------------
// Everything below is key to creating custom elements using the registerElement method.
//------------------------------------------------------

let UserSearch = Object.create(HTMLElement.prototype);

// Methods with `*` are specific to the custom element api
// *Created callback for custom element
UserSearch.createdCallback = function () {
    populateWithResults(this.getAttribute("name") || "", this);
};

// *Attribute callback for custom element
UserSearch.attributeChangedCallback = function (attrName, oldVal, newVal) {
    populateWithResults(newVal || "", this);
};

// *Register a custom element
// https://developer.mozilla.org/en-US/docs/Web/API/Document/registerElement
// document.registerElement() is deprecated; use customElements.define() instead
document.registerElement("user-search", {
    prototype: UserSearch
});