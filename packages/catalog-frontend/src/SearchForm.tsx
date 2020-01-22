import React, {useState} from 'react';

const SearchForm: React.FC = () => {
    const [query, setQuery] = useState("")

    const handleSubmit = (event: React.FormEvent) => {
        const baseUrl = "https://twitter.com/search?src=typed_query&q="
        const q = encodeURIComponent(
            "(#cdk AND (" + query.split(/ /).join(' OR ') + ")) (from:awscdkio) filter:links -filter:replies"
        )

        event.preventDefault()
        window.location.assign(baseUrl + q)
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text"
                value={query}
                placeholder="Search packages..."
                onChange={e => setQuery(e.target.value)}
                autoFocus />
        </form >
    );
}

export default SearchForm;
