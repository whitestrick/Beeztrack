# Beeztrack

A simple inventory management system for small business owners. It is a
single-page application (SPA) built with HTML, CSS and vanilla JavaScript,
using JSON Server as its backend.

## Project Status

In development. See the Issues and Project Board tabs for progress.

## MVP Features

1. **Product Management (CRUD):** add, view, edit and delete products.
2. **Stock Level Monitoring:** view quantities and get low-stock warnings
   when quantity falls to or below a minimum stock level.
3. **Search and Filter:** search products by name and filter by category
   or stock status.
4. **API Data Persistence:** product data is retrieved from and saved to a
   JSON Server backend, so changes remain after a page refresh.
5. **Inventory Summary:** the dashboard shows the total number of products
   and the total value of the inventory (price x quantity).

## Public API

[DummyJSON Products API](https://dummyjson.com/products) provides sample
product data for the initial inventory.

## Technologies

- HTML5, CSS3, JavaScript (ES modules)
- JSON Server (mock REST API)
- Vitest (testing)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file.