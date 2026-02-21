function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

import { tweetsData } from './data.js'
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

const openReplies = {}

function saveTweetStates() {
    const state = tweetsData.map(tweet => ({
        uuid: tweet.uuid,
        likes: tweet.likes,
        retweets: tweet.retweets,
        isLiked: tweet.isLiked,
        isRetweeted: tweet.isRetweeted,
        replies: tweet.replies.map(reply => ({
            likes: reply.likes,
            retweets: reply.retweets,
            isLiked: reply.isLiked,
            isRetweeted: reply.isRetweeted
        }))
    }))
    localStorage.setItem('tweetStates', JSON.stringify(state))
}

function loadTweetStates() {
    const savedState = JSON.parse(localStorage.getItem('tweetStates')) || []
    savedState.forEach(saved => {
        const tweet = tweetsData.find(t => t.uuid === saved.uuid)
        if (tweet) {
            tweet.likes = saved.likes
            tweet.retweets = saved.retweets
            tweet.isLiked = saved.isLiked
            tweet.isRetweeted = saved.isRetweeted
            saved.replies?.forEach((replyState, index) => {
                if (tweet.replies[index]) {
                    tweet.replies[index].likes = replyState.likes
                    tweet.replies[index].retweets = replyState.retweets
                    tweet.replies[index].isLiked = replyState.isLiked
                    tweet.replies[index].isRetweeted = replyState.isRetweeted
                }
            })
        }
    })
}

loadTweetStates()

document.addEventListener('click', function(e){
    if(e.target.dataset.like){
        handleLikeClick(e.target.dataset.like) 
    }
    else if(e.target.dataset.retweet){
        handleRetweetClick(e.target.dataset.retweet)
    }
    else if(e.target.dataset.reply){
        handleReplyClick(e.target.dataset.reply)
    }
    else if(e.target.id === 'tweet-btn'){
        handleTweetBtnClick()
    }
    else if(e.target.dataset.delete){
        handleDeleteClick(e.target.dataset.delete)
    }
    else if(e.target.dataset.sendReply){
        handleReplySubmit(e.target.dataset.sendReply)
    }
    else if(e.target.dataset.deleteReply){
        const tweetId = e.target.dataset.tweetId
        const replyIndex = parseInt(e.target.dataset.replyIndex)
        handleDeleteReply(tweetId, replyIndex)
    }
    else if(e.target.dataset.replyLike){
        handleReplyLikeClick(e.target.dataset.replyLike, e.target.dataset.tweetId)
    }
    else if(e.target.dataset.replyRetweet){
        handleReplyRetweetClick(e.target.dataset.replyRetweet, e.target.dataset.tweetId)
    }
})

function handleLikeClick(tweetId){ 
    const targetTweetObj = tweetsData.find(tweet => tweet.uuid === tweetId)
    if (targetTweetObj.isLiked){
        targetTweetObj.likes--
    } else {
        targetTweetObj.likes++ 
    }
    targetTweetObj.isLiked = !targetTweetObj.isLiked
    saveTweetStates()
    render()
}

function handleRetweetClick(tweetId){
    const targetTweetObj = tweetsData.find(tweet => tweet.uuid === tweetId)
    if(targetTweetObj.isRetweeted){
        targetTweetObj.retweets--
    } else {
        targetTweetObj.retweets++
    }
    targetTweetObj.isRetweeted = !targetTweetObj.isRetweeted
    saveTweetStates()
    render() 
}

function handleReplyClick(replyId){
    const el = document.getElementById(`replies-${replyId}`)
    el.classList.toggle('hidden')
    openReplies[replyId] = !el.classList.contains('hidden')
}

function handleTweetBtnClick(){
    const tweetInput = document.getElementById('tweet-input')

    if(tweetInput.value){
        const newTweet = {
            handle: `@Bilibili`,
            profilePic: `images/airbila.png`,
            likes: 0,
            retweets: 0,
            tweetText: tweetInput.value,
            replies: [],
            isLiked: false,
            isRetweeted: false,
            uuid: uuidv4()
        }
        tweetsData.unshift(newTweet)
        saveTweetStates()
        render()
        tweetInput.value = ''
    }
}

function handleDeleteClick(tweetId){
    const tweetIndex = tweetsData.findIndex(tweet => tweet.uuid === tweetId)
    if (tweetIndex !== -1){
        tweetsData.splice(tweetIndex, 1)
        saveTweetStates()
        render()
    }
}

function handleReplySubmit(tweetId) {
    const replyInputEl = document.getElementById(`reply-input-${tweetId}`)
    const replyText = replyInputEl.value.trim()

    if (replyText) {
        const targetTweetObj = tweetsData.find(tweet => tweet.uuid === tweetId)
        targetTweetObj.replies.push({
            handle: '@Bilibili',
            profilePic: 'images/airbila.png',
            tweetText: replyText,
            likes: 0,
            retweets: 0,
            isLiked: false,
            isRetweeted: false
        })
        replyInputEl.value = ''
        saveTweetStates()
        render()
        openReplies[tweetId] = true
    }
}

function handleDeleteReply(tweetId, replyIndex) {
    const tweet = tweetsData.find(t => t.uuid === tweetId)
    if (tweet && tweet.replies[replyIndex].handle === '@Bilibili') {
        tweet.replies.splice(replyIndex, 1)
        saveTweetStates()
        render()
        openReplies[tweetId] = true
    }
}

function handleReplyLikeClick(replyIndex, tweetId){
    const tweet = tweetsData.find(t => t.uuid === tweetId)
    if(tweet && tweet.replies[replyIndex]){
        const reply = tweet.replies[replyIndex]
        reply.isLiked = !reply.isLiked
        reply.likes += reply.isLiked ? 1 : -1
        saveTweetStates()
        render()
        openReplies[tweetId] = true
    }
}

function handleReplyRetweetClick(replyIndex, tweetId){
    const tweet = tweetsData.find(t => t.uuid === tweetId)
    if(tweet && tweet.replies[replyIndex]){
        const reply = tweet.replies[replyIndex]
        reply.isRetweeted = !reply.isRetweeted
        reply.retweets += reply.isRetweeted ? 1 : -1
        saveTweetStates()
        render()
        openReplies[tweetId] = true
    }
}

function getFeedHtml(){
    let feedHtml = ``

    tweetsData.forEach(function(tweet){
        let deleteBtnHtml = tweet.handle === '@Bilibili' 
            ? `<span class="delete-btn" data-delete="${tweet.uuid}">
                <i class="fa-solid fa-trash" data-delete="${tweet.uuid}"></i>
               </span>` : ''

        let likeIconClass = tweet.isLiked ? 'liked' : ''
        let retweetIconClass = tweet.isRetweeted ? 'retweeted' : ''

        const isOpen = openReplies[tweet.uuid] || false
        const repliesContainerClass = isOpen ? '' : 'hidden'

        let repliesHtml = `
<div class="reply-container ${repliesContainerClass}" id="replies-${tweet.uuid}">`

        tweet.replies.forEach(function(reply, index){
            const isOwnReply = reply.handle === '@Bilibili'
            const deleteReplyBtnHtml = isOwnReply 
                ? `<i class="fa-solid fa-trash delete-btn" data-delete-reply="true" data-tweet-id="${tweet.uuid}" data-reply-index="${index}"></i>` 
                : ''

            const replyLikeIcon = reply.isLiked ? 'liked' : ''
            const replyRetweetIcon = reply.isRetweeted ? 'retweeted' : ''

            repliesHtml += `
<div class="tweet-reply">
    <div class="tweet-inner">
        <img src="${reply.profilePic}" class="profile-pic">
        <div>
            <p class="handle">${reply.handle} ${deleteReplyBtnHtml}</p>
            <p class="tweet-text">${escapeHtml(reply.tweetText)}</p>
            <div class="tweet-details">
                <span class="tweet-detail">
                    <i class="fa-solid fa-heart ${replyLikeIcon}" data-reply-like="${index}" data-tweet-id="${tweet.uuid}"></i>
                    ${reply.likes || 0}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-retweet ${replyRetweetIcon}" data-reply-retweet="${index}" data-tweet-id="${tweet.uuid}"></i>
                    ${reply.retweets || 0}
                </span>
            </div>
        </div>
    </div>
</div>`
        })

        repliesHtml += `
    <div class="tweet-input-area tweet-reply">
        <img src="images/airbila.png" class="profile-pic">
        <div style="flex: 1;">
            <textarea class="reply-input" placeholder="Share your answer" id="reply-input-${tweet.uuid}"></textarea>
            <button class="reply-btn" data-send-reply="${tweet.uuid}">Reply</button>
        </div>
    </div>
</div>`

        feedHtml += `
<div class="tweet">
    <div class="tweet-inner">
        <img src="${tweet.profilePic}" class="profile-pic">
        ${deleteBtnHtml}
        <div>
            <p class="handle">${tweet.handle}</p>
            <p class="tweet-text">${escapeHtml(tweet.tweetText)}</p>
            <div class="tweet-details">
                <span class="tweet-detail">
                    <i class="fa-regular fa-comment-dots" data-reply="${tweet.uuid}"></i>
                    ${tweet.replies.length}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-heart ${likeIconClass}" data-like="${tweet.uuid}"></i>
                    ${tweet.likes}
                </span>
                <span class="tweet-detail">
                    <i class="fa-solid fa-retweet ${retweetIconClass}" data-retweet="${tweet.uuid}"></i>
                    ${tweet.retweets}
                </span>
            </div>   
        </div>            
    </div>
    ${repliesHtml}
</div>`
    })

    return feedHtml 
}

function render(){
    document.getElementById('feed').innerHTML = getFeedHtml()
}

render()
