import { QuartzComponent, QuartzComponentConstructor } from "./types"

const Comments: QuartzComponent = () => {
  return (
    <section class="comments-pixel">

      <h2>✦ LEAVE A COMMENT_</h2>

      <form id="comment-form">
        <input id="comment-name" placeholder="NAME..." />

        <textarea
          id="comment-message"
          placeholder="WRITE SOMETHING..."
        />

        <button>
          POST →
        </button>
      </form>

      <div id="comment-list">
        LOADING...
      </div>

    </section>
  )
}


Comments.afterDOMLoaded = `
console.log("Comments loaded")
`

export default (() => Comments) satisfies QuartzComponentConstructor