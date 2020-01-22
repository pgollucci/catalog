import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import SearchForm from '../SearchForm';

test('search field prompts user to search for packages', () => {
    const {getByPlaceholderText} = render(<SearchForm />);
    expect(getByPlaceholderText('Search packages...')).toBeInTheDocument()
});

test('search field has focus on page load', () => {
    const {getByPlaceholderText} = render(<SearchForm />);
    expect(getByPlaceholderText('Search packages...')).toHaveFocus()
});

test('submitting a search query redirects to twitter results', () => {
    window.location.assign = jest.fn();

    const expectedUrl = "https://twitter.com/search?src=typed_query&q=" +
        encodeURIComponent(
            "(#cdk AND (foo OR bar OR baz)) (from:awscdkio) filter:links -filter:replies"
        )
    const {getByPlaceholderText} = render(<SearchForm />);
    fireEvent.change(getByPlaceholderText('Search packages...'), {target: {value: "foo bar baz"}})
    fireEvent.submit(getByPlaceholderText('Search packages...'))

    expect(window.location.assign).toHaveBeenCalledWith(expectedUrl);

    (window.location.assign as jest.Mock).mockClear()
});
