function onLoad () {
  const inputEventListener = document.querySelector('#searchButton')
  inputEventListener.addEventListener('click', searchRequest)
  const contentBox = document.querySelector('.contentBox')
  contentBox.addEventListener('click', contentBoxEvents)
}

function contentBoxEvents (e) {
  e.preventDefault()
  if (e.target.getAttribute('dataAction') === 'forkLink') {
    showForks(e.target.getAttribute('forksLink'))
  } else if (e.target.getAttribute('dataAction') === 'commentSubmit') {
    addComment(e.target.parentElement.parentElement.parentElement)
  } else if (e.target.getAttribute('dataAction') === 'commentDelete') {
    deleteComment(e.target.parentElement.parentElement)
  }
}

function errorMessage (msg) {
  const errorDiv = document.querySelector('#error')
  errorDiv.innerHTML = ''
  errorDiv.appendChild(document.createTextNode(msg))
}

function clearErrorMessage () {
  document.querySelector('#error').innerHTML = ''
}

async function searchRequest () {
  clearErrorMessage()
  const input = document.querySelector('#search').value
  const repos = await sendRequest(`https://api.github.com/users/${input}/repos`)

  const contentBox = document.querySelector('.contentBox')
  contentBox.innerHTML = ''

  repos.forEach(repo => {
    const card = createRepoCard(repo)
    contentBox.appendChild(card)
  })
}

async function showForks (url) {
  clearErrorMessage()

  const forksData = await sendRequest(url)

  if (forksData.length === 0) {
    errorMessage('This repository has no forks')
    return
  }

  const cards = []

  for (const forkData of forksData) {
    const manifestUrl = forkData.url + '/contents/.manifest.json'
    const manifestData = await sendRequest(manifestUrl)

    if (manifestData.message === 'Not Found') {
      errorMessage(`Cannot show some forks for ${forkData.name}`)
      continue
    };

    const content = await JSON.parse(atob(manifestData.content))
    const codeFileUrl = forkData.url + '/contents/' + content.filePath
    const codeData = await sendRequest(codeFileUrl)

    if (codeData.message === 'Not Found') {
      errorMessage(`Cannot show some forks for ${forkData.name}`)
      continue
    };

    const code = atob(codeData.content)
    const card = await createForkCard(code, forkData)
    cards.push(card)
  }

  if (cards.length === 0) {
    errorMessage('This repository has no viewable forks')
    return
  }

  const contentBox = document.querySelector('.contentBox')
  contentBox.innerHTML = ''

  cards.forEach(card => {
    contentBox.appendChild(card)
  })
}

function createRepoCard (data) {
  const card = document.querySelector('#templateRepo').content.cloneNode(true).querySelector('.repoCard')
  card.querySelector('.repoName').appendChild(document.createTextNode(data.name))
  card.querySelector('.forksLink').setAttribute('forksLink', data.forks_url)
  card.querySelector('.gitLink').href = data.html_url
  card.querySelector('.forksCounter').appendChild(document.createTextNode(data.forks))
  return card
}

async function createForkCard (code, forkData) {
  const card = document.querySelector('#templateFork').content.cloneNode(true).querySelector('.forkLayout')
  card.setAttribute('dataId', forkData.id)
  const sourceCode = card.querySelector('.sourceCode')
  sourceCode.innerText = `${code}`
  card.querySelector('.forkName').innerText = forkData.full_name
  // eslint-disable-next-line no-undef
  hljs.highlightBlock(sourceCode)

  const comments = await getComments(forkData.id)
  comments.forEach(comment => {
    const commentCard = createCommentCard(comment)
    card.querySelector('.commentField').appendChild(commentCard)
  })

  let status = await getStatus(forkData.id)
  if (status === null) {
    addStatus(forkData.id)
    status = {status: 0}
  }

  card.querySelector('.status').selectedIndex = `${status.status}`

  return card
}

function createCommentCard (comment) {
  const commentDiv = document.querySelector('#templateComment').content.cloneNode(true).querySelector('.comment')
  commentDiv.querySelector('.commentText').appendChild(document.createTextNode(comment.text))
  commentDiv.querySelector('.commentSender').appendChild(document.createTextNode(comment.sender))
  commentDiv.setAttribute('dataId', comment.id)
  return commentDiv
}

async function sendRequest (url) {
  const response = await fetch(url)
  const jsonResponse = await response.json()

  if (jsonResponse != null && typeof jsonResponse.message === 'string') {
    if (jsonResponse.message.includes('API rate limit exceeded')) {
      errorMessage('API limit exeeded, please try again later.')
    }
  }


  return jsonResponse
}

async function getComments (projectId) {
  return await sendRequest(`http://localhost:9292/api/comments/get?projectId=${projectId}`)
}

async function addComment (forkDiv) {
  const comment = {}
  comment.text = forkDiv.querySelector('.commentText').value
  comment.sender = forkDiv.querySelector('.senderName').value
  comment.projectId = forkDiv.getAttribute('dataId')
  
  await fetch(`http://localhost:9292/api/comments/add?text=${comment.text}&sender=${comment.sender}&projectId=${comment.projectId}`, {method: 'POST'})
  
  forkDiv.querySelector('.commentText').value = ''
  forkDiv.querySelector('.senderName').value = ''
  const commentCard = await createCommentCard(comment)
  forkDiv.querySelector('.commentField').appendChild(commentCard)

  const status = forkDiv.querySelector('.status').selectedIndex
  updateStatus(comment.projectId, status)
}

async function deleteComment (commentDiv) {
  const id = commentDiv.getAttribute('dataId')

  await fetch(`http://localhost:9292/api/comments/delete?id=${id}`, {method: 'DELETE'})

  commentDiv.parentNode.removeChild(commentDiv)
}

async function getStatus (projectId) {
  return await sendRequest(`http://localhost:9292/api/forks/status?projectId=${projectId}`)
}

async function addStatus (projectId) {
  await fetch(`http://localhost:9292/api/forks/status?projectId=${projectId}`, {method: 'POST'})
}

async function updateStatus (projectId, status) {
  await fetch(`http://localhost:9292/api/forks/status?projectId=${projectId}&status=${status}`, {method: 'PATCH'})
}

onLoad()

// In case of emergency, use these
// repos = [
//     {
//         "id": 213903809,
//         "node_id": "MDEwOlJlcG9zaXRvcnkyMTM5MDM4MDk=",
//         "name": "smallest_of_two",
//         "full_name": "itggot/smallest_of_two",
//         "private": false,
//         "owner": {
//             "login": "itggot",
//             "id": 14072799,
//             "node_id": "MDEyOk9yZ2FuaXphdGlvbjE0MDcyNzk5",
//             "avatar_url": "https://avatars2.githubusercontent.com/u/14072799?v=4",
//             "gravatar_id": "",
//             "url": "https://api.github.com/users/itggot",
//             "html_url": "https://github.com/itggot",
//             "followers_url": "https://api.github.com/users/itggot/followers",
//             "following_url": "https://api.github.com/users/itggot/following{/other_user}",
//             "gists_url": "https://api.github.com/users/itggot/gists{/gist_id}",
//             "starred_url": "https://api.github.com/users/itggot/starred{/owner}{/repo}",
//             "subscriptions_url": "https://api.github.com/users/itggot/subscriptions",
//             "organizations_url": "https://api.github.com/users/itggot/orgs",
//             "repos_url": "https://api.github.com/users/itggot/repos",
//             "events_url": "https://api.github.com/users/itggot/events{/privacy}",
//             "received_events_url": "https://api.github.com/users/itggot/received_events",
//             "type": "Organization",
//             "site_admin": false
//         },
//         "html_url": "https://github.com/itggot/smallest_of_two",
//         "description": "En uppgift i Programmering x",
//         "fork": false,
//         "url": "https://api.github.com/repos/itggot/smallest_of_two",
//         "forks_url": "https://api.github.com/repos/itggot/smallest_of_two/forks",
//         "keys_url": "https://api.github.com/repos/itggot/smallest_of_two/keys{/key_id}",
//         "collaborators_url": "https://api.github.com/repos/itggot/smallest_of_two/collaborators{/collaborator}",
//         "teams_url": "https://api.github.com/repos/itggot/smallest_of_two/teams",
//         "hooks_url": "https://api.github.com/repos/itggot/smallest_of_two/hooks",
//         "issue_events_url": "https://api.github.com/repos/itggot/smallest_of_two/issues/events{/number}",
//         "events_url": "https://api.github.com/repos/itggot/smallest_of_two/events",
//         "assignees_url": "https://api.github.com/repos/itggot/smallest_of_two/assignees{/user}",
//         "branches_url": "https://api.github.com/repos/itggot/smallest_of_two/branches{/branch}",
//         "tags_url": "https://api.github.com/repos/itggot/smallest_of_two/tags",
//         "blobs_url": "https://api.github.com/repos/itggot/smallest_of_two/git/blobs{/sha}",
//         "git_tags_url": "https://api.github.com/repos/itggot/smallest_of_two/git/tags{/sha}",
//         "git_refs_url": "https://api.github.com/repos/itggot/smallest_of_two/git/refs{/sha}",
//         "trees_url": "https://api.github.com/repos/itggot/smallest_of_two/git/trees{/sha}",
//         "statuses_url": "https://api.github.com/repos/itggot/smallest_of_two/statuses/{sha}",
//         "languages_url": "https://api.github.com/repos/itggot/smallest_of_two/languages",
//         "stargazers_url": "https://api.github.com/repos/itggot/smallest_of_two/stargazers",
//         "contributors_url": "https://api.github.com/repos/itggot/smallest_of_two/contributors",
//         "subscribers_url": "https://api.github.com/repos/itggot/smallest_of_two/subscribers",
//         "subscription_url": "https://api.github.com/repos/itggot/smallest_of_two/subscription",
//         "commits_url": "https://api.github.com/repos/itggot/smallest_of_two/commits{/sha}",
//         "git_commits_url": "https://api.github.com/repos/itggot/smallest_of_two/git/commits{/sha}",
//         "comments_url": "https://api.github.com/repos/itggot/smallest_of_two/comments{/number}",
//         "issue_comment_url": "https://api.github.com/repos/itggot/smallest_of_two/issues/comments{/number}",
//         "contents_url": "https://api.github.com/repos/itggot/smallest_of_two/contents/{+path}",
//         "compare_url": "https://api.github.com/repos/itggot/smallest_of_two/compare/{base}...{head}",
//         "merges_url": "https://api.github.com/repos/itggot/smallest_of_two/merges",
//         "archive_url": "https://api.github.com/repos/itggot/smallest_of_two/{archive_format}{/ref}",
//         "downloads_url": "https://api.github.com/repos/itggot/smallest_of_two/downloads",
//         "issues_url": "https://api.github.com/repos/itggot/smallest_of_two/issues{/number}",
//         "pulls_url": "https://api.github.com/repos/itggot/smallest_of_two/pulls{/number}",
//         "milestones_url": "https://api.github.com/repos/itggot/smallest_of_two/milestones{/number}",
//         "notifications_url": "https://api.github.com/repos/itggot/smallest_of_two/notifications{?since,all,participating}",
//         "labels_url": "https://api.github.com/repos/itggot/smallest_of_two/labels{/name}",
//         "releases_url": "https://api.github.com/repos/itggot/smallest_of_two/releases{/id}",
//         "deployments_url": "https://api.github.com/repos/itggot/smallest_of_two/deployments",
//         "created_at": "2019-10-09T11:46:58Z",
//         "updated_at": "2019-10-17T08:28:58Z",
//         "pushed_at": "2019-10-17T08:28:57Z",
//         "git_url": "git://github.com/itggot/smallest_of_two.git",
//         "ssh_url": "git@github.com:itggot/smallest_of_two.git",
//         "clone_url": "https://github.com/itggot/smallest_of_two.git",
//         "svn_url": "https://github.com/itggot/smallest_of_two",
//         "homepage": null,
//         "size": 1,
//         "stargazers_count": 0,
//         "watchers_count": 0,
//         "language": null,
//         "has_issues": true,
//         "has_projects": true,
//         "has_downloads": true,
//         "has_wiki": true,
//         "has_pages": false,
//         "forks_count": 6,
//         "mirror_url": null,
//         "archived": false,
//         "disabled": false,
//         "open_issues_count": 0,
//         "license": null,
//         "forks": 6,
//         "open_issues": 0,
//         "watchers": 0,
//         "default_branch": "master"
//     },
//     {
//         "id": 130042138,
//         "node_id": "MDEwOlJlcG9zaXRvcnkxMzAwNDIxMzg=",
//         "name": "standard-biblioteket",
//         "full_name": "itggot/standard-biblioteket",
//         "private": false,
//         "owner": {
//             "login": "itggot",
//             "id": 14072799,
//             "node_id": "MDEyOk9yZ2FuaXphdGlvbjE0MDcyNzk5",
//             "avatar_url": "https://avatars2.githubusercontent.com/u/14072799?v=4",
//             "gravatar_id": "",
//             "url": "https://api.github.com/users/itggot",
//             "html_url": "https://github.com/itggot",
//             "followers_url": "https://api.github.com/users/itggot/followers",
//             "following_url": "https://api.github.com/users/itggot/following{/other_user}",
//             "gists_url": "https://api.github.com/users/itggot/gists{/gist_id}",
//             "starred_url": "https://api.github.com/users/itggot/starred{/owner}{/repo}",
//             "subscriptions_url": "https://api.github.com/users/itggot/subscriptions",
//             "organizations_url": "https://api.github.com/users/itggot/orgs",
//             "repos_url": "https://api.github.com/users/itggot/repos",
//             "events_url": "https://api.github.com/users/itggot/events{/privacy}",
//             "received_events_url": "https://api.github.com/users/itggot/received_events",
//             "type": "Organization",
//             "site_admin": false
//         },
//         "html_url": "https://github.com/itggot/standard-biblioteket",
//         "description": null,
//         "fork": false,
//         "url": "https://api.github.com/repos/itggot/standard-biblioteket",
//         "forks_url": "https://api.github.com/repos/itggot/standard-biblioteket/forks",
//         "keys_url": "https://api.github.com/repos/itggot/standard-biblioteket/keys{/key_id}",
//         "collaborators_url": "https://api.github.com/repos/itggot/standard-biblioteket/collaborators{/collaborator}",
//         "teams_url": "https://api.github.com/repos/itggot/standard-biblioteket/teams",
//         "hooks_url": "https://api.github.com/repos/itggot/standard-biblioteket/hooks",
//         "issue_events_url": "https://api.github.com/repos/itggot/standard-biblioteket/issues/events{/number}",
//         "events_url": "https://api.github.com/repos/itggot/standard-biblioteket/events",
//         "assignees_url": "https://api.github.com/repos/itggot/standard-biblioteket/assignees{/user}",
//         "branches_url": "https://api.github.com/repos/itggot/standard-biblioteket/branches{/branch}",
//         "tags_url": "https://api.github.com/repos/itggot/standard-biblioteket/tags",
//         "blobs_url": "https://api.github.com/repos/itggot/standard-biblioteket/git/blobs{/sha}",
//         "git_tags_url": "https://api.github.com/repos/itggot/standard-biblioteket/git/tags{/sha}",
//         "git_refs_url": "https://api.github.com/repos/itggot/standard-biblioteket/git/refs{/sha}",
//         "trees_url": "https://api.github.com/repos/itggot/standard-biblioteket/git/trees{/sha}",
//         "statuses_url": "https://api.github.com/repos/itggot/standard-biblioteket/statuses/{sha}",
//         "languages_url": "https://api.github.com/repos/itggot/standard-biblioteket/languages",
//         "stargazers_url": "https://api.github.com/repos/itggot/standard-biblioteket/stargazers",
//         "contributors_url": "https://api.github.com/repos/itggot/standard-biblioteket/contributors",
//         "subscribers_url": "https://api.github.com/repos/itggot/standard-biblioteket/subscribers",
//         "subscription_url": "https://api.github.com/repos/itggot/standard-biblioteket/subscription",
//         "commits_url": "https://api.github.com/repos/itggot/standard-biblioteket/commits{/sha}",
//         "git_commits_url": "https://api.github.com/repos/itggot/standard-biblioteket/git/commits{/sha}",
//         "comments_url": "https://api.github.com/repos/itggot/standard-biblioteket/comments{/number}",
//         "issue_comment_url": "https://api.github.com/repos/itggot/standard-biblioteket/issues/comments{/number}",
//         "contents_url": "https://api.github.com/repos/itggot/standard-biblioteket/contents/{+path}",
//         "compare_url": "https://api.github.com/repos/itggot/standard-biblioteket/compare/{base}...{head}",
//         "merges_url": "https://api.github.com/repos/itggot/standard-biblioteket/merges",
//         "archive_url": "https://api.github.com/repos/itggot/standard-biblioteket/{archive_format}{/ref}",
//         "downloads_url": "https://api.github.com/repos/itggot/standard-biblioteket/downloads",
//         "issues_url": "https://api.github.com/repos/itggot/standard-biblioteket/issues{/number}",
//         "pulls_url": "https://api.github.com/repos/itggot/standard-biblioteket/pulls{/number}",
//         "milestones_url": "https://api.github.com/repos/itggot/standard-biblioteket/milestones{/number}",
//         "notifications_url": "https://api.github.com/repos/itggot/standard-biblioteket/notifications{?since,all,participating}",
//         "labels_url": "https://api.github.com/repos/itggot/standard-biblioteket/labels{/name}",
//         "releases_url": "https://api.github.com/repos/itggot/standard-biblioteket/releases{/id}",
//         "deployments_url": "https://api.github.com/repos/itggot/standard-biblioteket/deployments",
//         "created_at": "2018-04-18T09:57:19Z",
//         "updated_at": "2018-04-19T10:51:43Z",
//         "pushed_at": "2018-04-19T10:51:43Z",
//         "git_url": "git://github.com/itggot/standard-biblioteket.git",
//         "ssh_url": "git@github.com:itggot/standard-biblioteket.git",
//         "clone_url": "https://github.com/itggot/standard-biblioteket.git",
//         "svn_url": "https://github.com/itggot/standard-biblioteket",
//         "homepage": null,
//         "size": 1,
//         "stargazers_count": 0,
//         "watchers_count": 0,
//         "language": null,
//         "has_issues": true,
//         "has_projects": true,
//         "has_downloads": true,
//         "has_wiki": true,
//         "has_pages": false,
//         "forks_count": 97,
//         "mirror_url": null,
//         "archived": false,
//         "disabled": false,
//         "open_issues_count": 0,
//         "license": null,
//         "forks": 97,
//         "open_issues": 0,
//         "watchers": 0,
//         "default_branch": "master"
//     },
//     {
//         "id": 88835815,
//         "node_id": "MDEwOlJlcG9zaXRvcnk4ODgzNTgxNQ==",
//         "name": "text-highlighter",
//         "full_name": "itggot/text-highlighter",
//         "private": false,
//         "owner": {
//             "login": "itggot",
//             "id": 14072799,
//             "node_id": "MDEyOk9yZ2FuaXphdGlvbjE0MDcyNzk5",
//             "avatar_url": "https://avatars2.githubusercontent.com/u/14072799?v=4",
//             "gravatar_id": "",
//             "url": "https://api.github.com/users/itggot",
//             "html_url": "https://github.com/itggot",
//             "followers_url": "https://api.github.com/users/itggot/followers",
//             "following_url": "https://api.github.com/users/itggot/following{/other_user}",
//             "gists_url": "https://api.github.com/users/itggot/gists{/gist_id}",
//             "starred_url": "https://api.github.com/users/itggot/starred{/owner}{/repo}",
//             "subscriptions_url": "https://api.github.com/users/itggot/subscriptions",
//             "organizations_url": "https://api.github.com/users/itggot/orgs",
//             "repos_url": "https://api.github.com/users/itggot/repos",
//             "events_url": "https://api.github.com/users/itggot/events{/privacy}",
//             "received_events_url": "https://api.github.com/users/itggot/received_events",
//             "type": "Organization",
//             "site_admin": false
//         },
//         "html_url": "https://github.com/itggot/text-highlighter",
//         "description": "En uppgift i Programmering 1",
//         "fork": false,
//         "url": "https://api.github.com/repos/itggot/text-highlighter",
//         "forks_url": "https://api.github.com/repos/itggot/text-highlighter/forks",
//         "keys_url": "https://api.github.com/repos/itggot/text-highlighter/keys{/key_id}",
//         "collaborators_url": "https://api.github.com/repos/itggot/text-highlighter/collaborators{/collaborator}",
//         "teams_url": "https://api.github.com/repos/itggot/text-highlighter/teams",
//         "hooks_url": "https://api.github.com/repos/itggot/text-highlighter/hooks",
//         "issue_events_url": "https://api.github.com/repos/itggot/text-highlighter/issues/events{/number}",
//         "events_url": "https://api.github.com/repos/itggot/text-highlighter/events",
//         "assignees_url": "https://api.github.com/repos/itggot/text-highlighter/assignees{/user}",
//         "branches_url": "https://api.github.com/repos/itggot/text-highlighter/branches{/branch}",
//         "tags_url": "https://api.github.com/repos/itggot/text-highlighter/tags",
//         "blobs_url": "https://api.github.com/repos/itggot/text-highlighter/git/blobs{/sha}",
//         "git_tags_url": "https://api.github.com/repos/itggot/text-highlighter/git/tags{/sha}",
//         "git_refs_url": "https://api.github.com/repos/itggot/text-highlighter/git/refs{/sha}",
//         "trees_url": "https://api.github.com/repos/itggot/text-highlighter/git/trees{/sha}",
//         "statuses_url": "https://api.github.com/repos/itggot/text-highlighter/statuses/{sha}",
//         "languages_url": "https://api.github.com/repos/itggot/text-highlighter/languages",
//         "stargazers_url": "https://api.github.com/repos/itggot/text-highlighter/stargazers",
//         "contributors_url": "https://api.github.com/repos/itggot/text-highlighter/contributors",
//         "subscribers_url": "https://api.github.com/repos/itggot/text-highlighter/subscribers",
//         "subscription_url": "https://api.github.com/repos/itggot/text-highlighter/subscription",
//         "commits_url": "https://api.github.com/repos/itggot/text-highlighter/commits{/sha}",
//         "git_commits_url": "https://api.github.com/repos/itggot/text-highlighter/git/commits{/sha}",
//         "comments_url": "https://api.github.com/repos/itggot/text-highlighter/comments{/number}",
//         "issue_comment_url": "https://api.github.com/repos/itggot/text-highlighter/issues/comments{/number}",
//         "contents_url": "https://api.github.com/repos/itggot/text-highlighter/contents/{+path}",
//         "compare_url": "https://api.github.com/repos/itggot/text-highlighter/compare/{base}...{head}",
//         "merges_url": "https://api.github.com/repos/itggot/text-highlighter/merges",
//         "archive_url": "https://api.github.com/repos/itggot/text-highlighter/{archive_format}{/ref}",
//         "downloads_url": "https://api.github.com/repos/itggot/text-highlighter/downloads",
//         "issues_url": "https://api.github.com/repos/itggot/text-highlighter/issues{/number}",
//         "pulls_url": "https://api.github.com/repos/itggot/text-highlighter/pulls{/number}",
//         "milestones_url": "https://api.github.com/repos/itggot/text-highlighter/milestones{/number}",
//         "notifications_url": "https://api.github.com/repos/itggot/text-highlighter/notifications{?since,all,participating}",
//         "labels_url": "https://api.github.com/repos/itggot/text-highlighter/labels{/name}",
//         "releases_url": "https://api.github.com/repos/itggot/text-highlighter/releases{/id}",
//         "deployments_url": "https://api.github.com/repos/itggot/text-highlighter/deployments",
//         "created_at": "2017-04-20T07:44:08Z",
//         "updated_at": "2017-04-20T08:28:03Z",
//         "pushed_at": "2017-04-25T08:05:59Z",
//         "git_url": "git://github.com/itggot/text-highlighter.git",
//         "ssh_url": "git@github.com:itggot/text-highlighter.git",
//         "clone_url": "https://github.com/itggot/text-highlighter.git",
//         "svn_url": "https://github.com/itggot/text-highlighter",
//         "homepage": "",
//         "size": 31,
//         "stargazers_count": 0,
//         "watchers_count": 0,
//         "language": null,
//         "has_issues": true,
//         "has_projects": true,
//         "has_downloads": true,
//         "has_wiki": true,
//         "has_pages": false,
//         "forks_count": 6,
//         "mirror_url": null,
//         "archived": false,
//         "disabled": false,
//         "open_issues_count": 0,
//         "license": null,
//         "forks": 6,
//         "open_issues": 0,
//         "watchers": 0,
//         "default_branch": "master"
//     },
// ]

// forksData = [
//     {
//         "id": 215999269,
//         "node_id": "MDEwOlJlcG9zaXRvcnkyMTU5OTkyNjk=",
//         "name": "smallest_of_two",
//         "full_name": "TE4-oskar-pilborg/smallest_of_two",
//         "private": false,
//         "owner": {
//             "login": "TE4-oskar-pilborg",
//             "id": 54275481,
//             "node_id": "MDQ6VXNlcjU0Mjc1NDgx",
//             "avatar_url": "https://avatars0.githubusercontent.com/u/54275481?v=4",
//             "gravatar_id": "",
//             "url": "https://api.github.com/users/TE4-oskar-pilborg",
//             "html_url": "https://github.com/TE4-oskar-pilborg",
//             "followers_url": "https://api.github.com/users/TE4-oskar-pilborg/followers",
//             "following_url": "https://api.github.com/users/TE4-oskar-pilborg/following{/other_user}",
//             "gists_url": "https://api.github.com/users/TE4-oskar-pilborg/gists{/gist_id}",
//             "starred_url": "https://api.github.com/users/TE4-oskar-pilborg/starred{/owner}{/repo}",
//             "subscriptions_url": "https://api.github.com/users/TE4-oskar-pilborg/subscriptions",
//             "organizations_url": "https://api.github.com/users/TE4-oskar-pilborg/orgs",
//             "repos_url": "https://api.github.com/users/TE4-oskar-pilborg/repos",
//             "events_url": "https://api.github.com/users/TE4-oskar-pilborg/events{/privacy}",
//             "received_events_url": "https://api.github.com/users/TE4-oskar-pilborg/received_events",
//             "type": "User",
//             "site_admin": false
//         },
//         "html_url": "https://github.com/TE4-oskar-pilborg/smallest_of_two",
//         "description": "En uppgift i Programmering x",
//         "fork": true,
//         "url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two",
//         "forks_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/forks",
//         "keys_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/keys{/key_id}",
//         "collaborators_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/collaborators{/collaborator}",
//         "teams_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/teams",
//         "hooks_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/hooks",
//         "issue_events_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/issues/events{/number}",
//         "events_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/events",
//         "assignees_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/assignees{/user}",
//         "branches_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/branches{/branch}",
//         "tags_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/tags",
//         "blobs_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/blobs{/sha}",
//         "git_tags_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/tags{/sha}",
//         "git_refs_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/refs{/sha}",
//         "trees_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/trees{/sha}",
//         "statuses_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/statuses/{sha}",
//         "languages_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/languages",
//         "stargazers_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/stargazers",
//         "contributors_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/contributors",
//         "subscribers_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/subscribers",
//         "subscription_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/subscription",
//         "commits_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/commits{/sha}",
//         "git_commits_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/commits{/sha}",
//         "comments_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/comments{/number}",
//         "issue_comment_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/issues/comments{/number}",
//         "contents_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/contents/{+path}",
//         "compare_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/compare/{base}...{head}",
//         "merges_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/merges",
//         "archive_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/{archive_format}{/ref}",
//         "downloads_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/downloads",
//         "issues_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/issues{/number}",
//         "pulls_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/pulls{/number}",
//         "milestones_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/milestones{/number}",
//         "notifications_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/notifications{?since,all,participating}",
//         "labels_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/labels{/name}",
//         "releases_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/releases{/id}",
//         "deployments_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/deployments",
//         "created_at": "2019-10-18T10:26:52Z",
//         "updated_at": "2019-10-18T11:40:14Z",
//         "pushed_at": "2019-10-18T11:40:12Z",
//         "git_url": "git://github.com/TE4-oskar-pilborg/smallest_of_two.git",
//         "ssh_url": "git@github.com:TE4-oskar-pilborg/smallest_of_two.git",
//         "clone_url": "https://github.com/TE4-oskar-pilborg/smallest_of_two.git",
//         "svn_url": "https://github.com/TE4-oskar-pilborg/smallest_of_two",
//         "homepage": null,
//         "size": 4,
//         "stargazers_count": 0,
//         "watchers_count": 0,
//         "language": "JavaScript",
//         "has_issues": false,
//         "has_projects": true,
//         "has_downloads": true,
//         "has_wiki": true,
//         "has_pages": false,
//         "forks_count": 1,
//         "mirror_url": null,
//         "archived": false,
//         "disabled": false,
//         "open_issues_count": 0,
//         "license": null,
//         "forks": 1,
//         "open_issues": 0,
//         "watchers": 0,
//         "default_branch": "master"
//     },
// ]

// manifestData = {
//   "name": ".manifest.json",
//   "path": ".manifest.json",
//   "sha": "927c43da7ec96ef37399c723f507cbbbbe6814d4",
//   "size": 542,
//   "url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/contents/.manifest.json?ref=master",
//   "html_url": "https://github.com/TE4-oskar-pilborg/smallest_of_two/blob/master/.manifest.json",
//   "git_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/blobs/927c43da7ec96ef37399c723f507cbbbbe6814d4",
//   "download_url": "https://raw.githubusercontent.com/TE4-oskar-pilborg/smallest_of_two/master/.manifest.json",
//   "type": "file",
//   "content": "ewogICAgImFzc2lnbm1lbnROYW1lIjogIlNtYWxsZXN0IG9mIFR3byIsCiAg\nICAiZmlsZVBhdGgiOiAibGliL3NtYWxsZXN0X29mX3R3by5qcyIsCiAgICAi\nbGFuZ3VhZ2UiOiAiamF2YXNjcmlwdCIsCiAgICAiZnVuY3Rpb25OYW1lIjog\nInNtYWxsZXN0T2ZUd28iLAogICAgImZ1bmN0aW9uUGFyYW1ldGVycyI6IFsi\nbnVtMSIsICJudW0yIl0sCiAgICAiZnVuY3Rpb25TcGFuIjogWzIsIDJdLAog\nICAgInRlc3RzIjogWwogICAgICAgIHsiZGVzY3JpcHRpb24iOiAiRmlyc3Qg\naXMgc21hbGxlc3QiLCAKICAgICAgICAgImFyZ3VtZW50cyI6IFsxLDJdLCAK\nICAgICAgICAgImV4cGVjdGVkIjogMX0sCiAgICAgICAgeyJkZXNjcmlwdGlv\nbiI6ICJTZWNvbmQgaXMgc21hbGxlc3QiLCAKICAgICAgICAgImFyZ3VtZW50\ncyI6IFsyLDFdLCAKICAgICAgICAgImV4cGVjdGVkIjogMX0sCiAgICAgICAg\neyJkZXNjcmlwdGlvbiI6ICJTYW1lIHNpemUiLCAKICAgICAgICAgImFyZ3Vt\nZW50cyI6IFsyLDJdLCAKICAgICAgICAgImV4cGVjdGVkIjogMn0KICAgIF0K\nfQo=\n",
//   "encoding": "base64",
//   "_links": {
//       "self": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/contents/.manifest.json?ref=master",
//       "git": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/blobs/927c43da7ec96ef37399c723f507cbbbbe6814d4",
//       "html": "https://github.com/TE4-oskar-pilborg/smallest_of_two/blob/master/.manifest.json"
//   }
// }

// codeData = {
//   "name": "smallest_of_two.js",
//   "path": "lib/smallest_of_two.js",
//   "sha": "1515d94581e366c0b3155bce317a3f845f4f2656",
//   "size": 39,
//   "url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/contents/lib/smallest_of_two.js?ref=master",
//   "html_url": "https://github.com/TE4-oskar-pilborg/smallest_of_two/blob/master/lib/smallest_of_two.js",
//   "git_url": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/blobs/1515d94581e366c0b3155bce317a3f845f4f2656",
//   "download_url": "https://raw.githubusercontent.com/TE4-oskar-pilborg/smallest_of_two/master/lib/smallest_of_two.js",
//   "type": "file",
//   "content": "ZnVuY3Rpb24gc21hbGwoKXsNCiAgcmV0dXJuICJ0am8iOw0KfQ0K\n",
//   "encoding": "base64",
//   "_links": {
//       "self": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/contents/lib/smallest_of_two.js?ref=master",
//       "git": "https://api.github.com/repos/TE4-oskar-pilborg/smallest_of_two/git/blobs/1515d94581e366c0b3155bce317a3f845f4f2656",
//       "html": "https://github.com/TE4-oskar-pilborg/smallest_of_two/blob/master/lib/smallest_of_two.js"
//   }
// }