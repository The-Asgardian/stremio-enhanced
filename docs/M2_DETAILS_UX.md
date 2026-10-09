# M2 title-details layout slice

At widths up to 800px, title metadata now stacks above the episode or stream panel instead of competing for narrow side-by-side columns. The page scrolls as one vertical surface, with the stream panel retaining a usable minimum touch area. Wider desktop layouts keep the existing split view.

This keeps the Stremio title, season, and source flow intact while improving tablet and phone-sized layouts. The layout was reviewed at a 646px-wide local browser window; native-device validation remains outstanding.

When the saved library state identifies an unfinished video and core provides its player deep link, the title page offers a localized Resume action. Series identify the saved season and episode; films use the same action without episode details. Completed, upcoming, missing, or unroutable videos do not show Resume. Navigation uses the existing core deep link and leaves playback and addon protocols unchanged.
