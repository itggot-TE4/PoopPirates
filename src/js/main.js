const inputEventListener = document.querySelector('#searchbar');
inputEventListener.addEventListener('keyup', searchRequest);

function onLoad(){
    
}

onLoad()

function searchRequest() {
    const input = document.querySelector('#searchbar').value;
    const result = await fetch(`https://api.github.com/users/${input}/repo`);
    createRepoCard(result);
}