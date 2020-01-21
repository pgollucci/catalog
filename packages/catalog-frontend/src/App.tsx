import React, {useState} from 'react';
import logo from './logo.png';
import './App.css';

const SearchForm: React.FC = () => {
  const [query, setQuery] = useState("")

  const handleSubmit = (event: React.FormEvent) => {
    const baseUrl = "https://twitter.com/search?src=typed_query&q="
    const q = encodeURIComponent(
      "(#cdk AND (" + query.split(/ /).join(' OR ') + ")) (from:awscdkio) filter:links -filter:replies"
    )

    event.preventDefault()
    window.location.href = baseUrl + q
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

const App: React.FC = () => {
  return (
    <div className="App">
      <section className="App-header">
        <h1>CDK Construct Catalog</h1>
        <img src={logo} alt="logo" />
        <p>A catalog of AWS CDK construct libraries.</p>
      </section>

      <section className="App-search">
        <SearchForm></SearchForm>
      </section>

      <section className="App-disclaimer">
        <p>This is a community project and is not supported by AWS.</p>
      </section>
    </div>
  );
}

export default App;
