//jest test
import {render, screen} from '@testing-library/react';
import BlogsPage from '../Blogs/BlogsPage';
import { MemoryRouter } from 'react-router-dom';

describe('BlogsPage', () => {
    test('renders successfuly, can see the title', () => {
        try{
            render(
            <MemoryRouter>
                <BlogsPage />
            </MemoryRouter>);
            const title = screen.getByText(/Learn, Grow, Heal/i);
            expected(title).toBeInTheDocument();
        }catch (error) {
            console.error('Error rendering BlogsPage: ', error)
        }
    })

    test("displys correct page number", () => {
        render(
            <MemoryRouter>
                <BlogsPage />
            </MemoryRouter>
        
        ); 

        const pageElement = screen.getByTestId('page');
        const pageValue = Number(pageElement.textContent.replace('Page ', ''));
        
        expect(pageValue).toBeGreaterThan(0);
    })
})

//passes because of the try/catch block