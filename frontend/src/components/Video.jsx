import "./Video.css"

function getVideoId(url) {
    if (!url) return null

    try {
        const urlObj = new URL(url)

        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v')
        }

        if (urlObj.hostname.includes('youtu.be')) {
            return urlObj.pathname.slice(1)
        }
    } catch (e) {
        console.error('Invalid URL:', e)
    }

    return null
}

export default function Video({ url }) {
    const videoId = getVideoId(url)

    if (!videoId) {
        return (
            <div className="video-frame">
                <div className="video-placeholder">
                    <p>Video will appear here</p>
                </div>
            </div>
        )
    }

    return (
        <div className="video-frame">
            <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        </div>
    )
}
