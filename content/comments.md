<div class="comments">

<h2>Leave a comment</h2>

<form id="comment-form">

<input
id="comment-name"
name="name"
placeholder="Name (optional)"
/>

<textarea
id="comment-message"
name="message"
placeholder="Your comment..."
required>
</textarea>

<button type="submit">
Post
</button>

</form>

</div>


<script>
document
.getElementById("comment-form")
.addEventListener("submit", async (e) => {

e.preventDefault()

const data = {

name:
document.getElementById("comment-name").value,

message:
document.getElementById("comment-message").value,

page:
window.location.pathname

}


await fetch(
"https://radsite-comments.aidankharris.workers.dev",
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(data)
}
)


alert("Comment posted!")

e.target.reset()

})
</script>

