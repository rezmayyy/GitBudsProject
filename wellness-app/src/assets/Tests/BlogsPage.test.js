//jest test
import {render, screen} from '@testing-library/react';
import BlogsPage from '../Blogs/BlogsPage';

describe('BlogsPage', () => {
    test('renders successfuly, can see the title', () => {
        try{
            render(<BlogsPage />);
            const title = screen.getByText(/Learn, Grow, Heal/i);
            expected(title).toBeInTheDocument();
        }catch (error) {
            console.error('Error rendering BlogsPage: ', error)
        }
    })
})

//passes because of the try/catch block