// https://developer.mozilla.org/en-US/docs/Web/Web_Components/Custom_Elements

let searchElement = document.querySelector("user-search");

document.querySelector("input").addEventListener("keyup", (event) => {
    searchElement.setAttribute("name", event.target.value);
});

class UserSearch extends HTMLElement {
    static get users() {
        return new Promise((resolve, reject) => {
            if (this.usersList) {
                resolve(this.usersList);
            }

            fetch("https://jsonplaceholder.typicode.com/users")
                .then(response => response.json())
                .then(usersJson => {
                    this.usersList = usersJson;

                    resolve(this.usersList);
                });
        });
    }

    static get observedAttributes() {
        return ["name"];
    }

    constructor() {
        super();
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        this.populateWithResults(newValue || "", this);
    }

    clearShadowRoot(container) {
        if (container.shadowRoot) {
            container.shadowRoot.textContent = "";
        }
    }

    // http://stackoverflow.com/a/38694640/2344083
    filterTextByTerms(text, searchTerms) {
        let regexStr = `(?=.*${searchTerms.join(")(?=.*")})`;
        let searchRegEx = new RegExp(regexStr, "gi");

        return text.match(searchRegEx) !== null;
    }

    populateWithResults(searchName, container) {
        searchName = searchName.trim();

        if (searchName) {
            UserSearch.users
                .then(users => {
                    let searchTerms = searchName.toLowerCase().split(/[^A-Za-z]/);

                    let searchResults = users.filter(user => this.filterTextByTerms(user.name.toLowerCase(), searchTerms));

                    let shadow;
                    if (container.shadowRoot) {
                        this.clearShadowRoot(container);
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
            this.clearShadowRoot(container);
        }
    }
}

customElements.define("user-search", UserSearch);