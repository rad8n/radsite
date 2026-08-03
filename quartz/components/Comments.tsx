import { QuartzComponent, QuartzComponentConstructor } from "./types"

const Comments: QuartzComponent = () => {
  return (
    <section className="comments">
      <h2>Leave a comment</h2>

      <form
        id="comment-form"
        onSubmit={(e) => {
          e.preventDefault()

          const form = e.currentTarget

          const data = {
            name: (
              form.elements.namedItem("name") as HTMLInputElement
            ).value,

            message: (
              form.elements.namedItem("message") as HTMLTextAreaElement
            ).value,

            page: window.location.pathname
          }


          fetch(
            "radsite-comments.aidankharris.workers.dev",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json"
              },

              body: JSON.stringify(data)
            }
          )
          .then(() => {
            alert("Comment submitted!")
            form.reset()
          })
          .catch(() => {
            alert("Something went wrong.")
          })
        }}
      >

        <input
          name="name"
          placeholder="Name (optional)"
        />

        <textarea
          name="message"
          placeholder="Your comment..."
          required
        />

        <button type="submit">
          Post
        </button>

      </form>
    </section>
  )
}


Comments.css = `
`

export default (() => Comments) satisfies QuartzComponentConstructor