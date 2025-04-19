import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventSearch from '../../Events/EventSearch';

describe('EventSearch Component', () => {
    // Fake Events
    const mockEvents = [
        {
            title: 'Healing Circle',
            titleLower: 'healing circle',
            eventType: 'Workshop',
        },
        {
            title: 'Spiritual Retreat',
            titleLower: 'spiritual retreat',
            eventType: 'Retreat',
        },
    ];

    const mockSetFilteredEvents = jest.fn();

    beforeEach(() => {
        render(
            <EventSearch
                events={mockEvents}
                setFilteredEvents={mockSetFilteredEvents}
            />
        );
        mockSetFilteredEvents.mockClear();
    });

    // Test Search: 'healing' and 'Healing Circle' should appear
    test('displays filtered event when search matches', async () => {
        const input = screen.getByPlaceholderText(/search events/i);
        await userEvent.type(input, 'healing');

        await waitFor(() => {
            expect(mockSetFilteredEvents).toHaveBeenCalled();
            const filtered = mockSetFilteredEvents.mock.calls.at(-1)[0];
            expect(filtered).toHaveLength(1);
            expect(filtered[0].title).toBe('Healing Circle');
        });
    }); // Passed, healing searched for 'Healing Circle' Event

    // Test for search for nonexistent event
    test('returns no events when search does not match', async () => {
        const input = screen.getByPlaceholderText(/search events/i);
        await userEvent.type(input, 'nonexistent event');

        await waitFor(() => {
            expect(mockSetFilteredEvents).toHaveBeenCalled();
            const filtered = mockSetFilteredEvents.mock.calls.at(-1)[0];
            expect(filtered).toHaveLength(0);
        });
    }); // Pass. no events appear

    // Test for filter by event tab. 
    // Simulating there are no webinar events so no event should appear. 
    test('filters by event type tab', async () => {
        const webinarTab = screen.getByRole('button', { name: /webinar/i });
        await userEvent.click(webinarTab);

        await waitFor(() => {
            const filtered = mockSetFilteredEvents.mock.calls.at(-1)[0];
            expect(filtered).toHaveLength(0);
        });
    }); // Pass. no events appear because I didn't mock any webinar events

    // Test to make sure filter and search work together. Retreat tab and 'retreat' search
    test('filters by type + search together', async () => {
        const input = screen.getByPlaceholderText(/search events/i);
        const retreatTab = screen.getByRole('button', { name: /retreat/i });

        await userEvent.type(input, 'retreat');
        await userEvent.click(retreatTab);

        await waitFor(() => {
            const filtered = mockSetFilteredEvents.mock.calls.at(-1)[0];
            expect(filtered).toHaveLength(1);
            expect(filtered[0].title).toBe('Spiritual Retreat');
        });
    }); // Pass
});
// All test pass. Searching works and filtering works