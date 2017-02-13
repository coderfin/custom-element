// https://github.com/w3c/webcomponents/issues/587#issuecomment-254017839
// https://github.com/whatwg/html/issues/1704#issuecomment-241668187

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
// Everything below is key to creating custom elements using the Reflect.construct method.
//------------------------------------------------------

function UserSearch() {
    return Reflect.construct(HTMLElement, [], UserSearch);
}

UserSearch.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
    populateWithResults(newValue || "", this);
}

UserSearch.observedAttributes = ["name"];

Object.setPrototypeOf(UserSearch.prototype, HTMLElement.prototype);
Object.setPrototypeOf(UserSearch, HTMLElement);

customElements.define("user-search", UserSearch);

//------------------------------------------------------
// This is a secondary way to accomplish the same thing.
//------------------------------------------------------

// let UserSearch = function () { // Constructor
//     let element = Reflect.construct(HTMLElement, [], UserSearch);

//     populateWithResults(element.getAttribute("name") || "", element);

//     new MutationObserver(mutations => {
//         mutations.forEach(mutation => {
//             populateWithResults(mutation.target.getAttribute("name") || "", element);
//         });    
//     }).observe(element, { 
//         attributes: true,
//     });


//     attributeChangedCallback = function (attrName, oldVal, newVal) {
//         populateWithResults(newVal || "", this);
//     };

//     return element;
// };

// UserSearch.prototype.__proto__ = HTMLElement.prototype;
// UserSearch.__proto__ = HTMLElement;