import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import App from '../App';

test('displays the correct title', () => {
  const {getByRole} = render(<App />);
  expect(getByRole('heading').textContent).toBe('CDK Construct Catalog')
});

// test('search field has focus on page load', () => {
//   const onSubmit = jest.fn();

//   const {getByText, getByPlaceholderText} = render(<App />);
//   getByPlaceholderText('Search packages...').nodeValue = 'foo'
//   console.log(getByPlaceholderText('Search packages...').nodeValue)
// });
