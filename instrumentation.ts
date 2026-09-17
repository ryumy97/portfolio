export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { watchBlogSources } = await import("./lib/blog-watcher");
    watchBlogSources();
  }
}
