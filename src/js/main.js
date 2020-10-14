const inputEventListener = document.querySelector('#searchbar');
inputEventListener.addEventListener('keyup', searchRequest);

function onLoad(){
    
}

function repoCardCreate(data){
    let card = document.querySelector('#templateRepo').content.cloneNode(true).querySelector('.repoCard')
    card.querySelector('.repoName').appendChild(document.createTextNode(data.name))
    card.querySelector('.forksLink').href = data.forks_url
    card.querySelector('.gitLink').href = data.html_url
    card.querySelector('.forksCounter').appendChild(document.createTextNode(data.forks))
    return card
}

onLoad()
function searchRequest() {
    const input = document.querySelector('#searchbar').value;
    const result = await fetch(`https://api.github.com/users/${input}/repo`);
    createRepoCard(result);
}