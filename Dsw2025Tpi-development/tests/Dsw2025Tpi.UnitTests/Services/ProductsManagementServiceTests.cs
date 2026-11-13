using System.Linq.Expressions;
using Dsw2025Tpi.Application.Dtos;
using Dsw2025Tpi.Application.Exceptions;
using Dsw2025Tpi.Application.Services;
using Dsw2025Tpi.Domain.Entities;
using Dsw2025Tpi.Domain.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace Dsw2025Tpi.UnitTests.Services;

public class ProductsManagementServiceTests
{
    private readonly Mock<IRepository> _repositoryMock;
    private readonly Mock<ILogger<ProductsManagementService>> _loggerMock;
    private readonly ProductsManagementService _service;

    public ProductsManagementServiceTests()
    {
        _repositoryMock = new Mock<IRepository>();
        _loggerMock = new Mock<ILogger<ProductsManagementService>>();
        _service = new ProductsManagementService(_repositoryMock.Object, _loggerMock.Object);
    }

//Prueba 1
// Camino Feliz 


    [Fact]
    public async Task AddProduct_WithValidData_ReturnsProductAndCallsRepositoryAdd()
    {
        // Arrange
        var request = new ProductModel.Request(
            Sku: "SKU-001",
            InternalCode: "INT-001",
            Name: "Mouse Gamer",
            Description: "Mouse RGB 7200 DPI",
            CurrentUnitPrice: 15000m,
            StockQuantity: 10);

        _repositoryMock
            .Setup(r => r.First<Product>(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<string[]>()))
            .ReturnsAsync((Product?)null);

        _repositoryMock
            .Setup(r => r.Add(It.IsAny<Product>()))
            .ReturnsAsync((Product p) => p);

        // Act
        var result = await _service.AddProduct(request);

        // Assert
        result.Should().NotBeNull();
        result.Sku.Should().Be("SKU-001");
        result.Name.Should().Be("Mouse Gamer");
        result.CurrentUnitPrice.Should().Be(15000m);
        result.StockQuantity.Should().Be(10);
        result.IsActive.Should().BeTrue();

        _repositoryMock.Verify(
            r => r.Add(It.Is<Product>(p => p.Sku == "SKU-001" && p.StockQuantity == 10)),
            Times.Once);
    }

//Prueba 2
// SKU duplicado
    
    [Fact]
    public async Task AddProduct_WithDuplicateSku_ThrowsDuplicatedEntityException()
    {
        // Arrange
        var request = new ProductModel.Request(
            Sku: "SKU-001",
            InternalCode: "INT-002",
            Name: "Teclado Mecánico",
            Description: "Teclado switch red",
            CurrentUnitPrice: 30000m,
            StockQuantity: 5);

        var existingProduct = new Product("SKU-001", "Mouse Gamer", 15000m, 10, "Mouse RGB", "INT-001");

        _repositoryMock
            .Setup(r => r.First<Product>(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<string[]>()))
            .ReturnsAsync(existingProduct);

        // Act
        var act = () => _service.AddProduct(request);

        // Assert
        await act.Should().ThrowAsync<DuplicatedEntityException>()
            .WithMessage("Ya existe un producto con el mismo SKU SKU-001");

        _repositoryMock.Verify(r => r.Add(It.IsAny<Product>()), Times.Never);
    }

//Prueba 3
//precio o stock inválido

    
    [Theory]
    [InlineData(-1, 10, "El precio unitario ser mayores a cero")]
    [InlineData(15000, 0, "La cantidad de stock debe ser mayor o igual a cero")]
    [InlineData(15000, -5, "La cantidad de stock debe ser mayor o igual a cero")]
    public async Task AddProduct_WithInvalidStockOrPrice_ThrowsInvalidDataException(
        decimal price, int stock, string expectedMessage)
    {
        // Arrange
        var request = new ProductModel.Request(
            Sku: "SKU-001",
            InternalCode: "INT-001",
            Name: "Mouse Gamer",
            Description: "Mouse RGB 7200 DPI",
            CurrentUnitPrice: price,
            StockQuantity: stock);

        // Act
        var act = () => _service.AddProduct(request);

        // Assert
        await act.Should().ThrowAsync<InvalidDataException>()
            .WithMessage(expectedMessage);

        _repositoryMock.Verify(
            r => r.First<Product>(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<string[]>()),
            Times.Never);
        _repositoryMock.Verify(r => r.Add(It.IsAny<Product>()), Times.Never);
    }

    //Listado de Productos
    private void SetupGetFilteredWith(List<Product> products)
    {
        // El Mock aplica el filtro que arma el servicio, como lo haría la base de datos
        _repositoryMock
            .Setup(r => r.GetFiltered<Product>(It.IsAny<Expression<Func<Product, bool>>>(), It.IsAny<string[]>()))
            .ReturnsAsync((Expression<Func<Product, bool>> filter, string[] _) =>
                products.Where(filter.Compile()).ToList());
    }

    [Fact]
    public async Task GetProducts_WhenIncludeInactiveIsFalse_ReturnsOnlyActiveProducts()
    {
        // Arrange
        SetupGetFilteredWith(new List<Product>
        {
            new Product("SKU-001", "Mouse Gamer", 15000m, 10),
            new Product("SKU-002", "Teclado Mecánico", 30000m, 5),
            new Product("SKU-003", "Monitor", 90000m, 3) { IsActive = false }
        });

        var filter = new ProductModel.FilterProduct(Status: null, Search: null, PageNumber: null, PageSize: null);

        // Act
        var result = await _service.GetProducts(filter, includeInactive: false);

        // Assert
        result.ProductItems.Should().HaveCount(2);
        result.ProductItems.Should().OnlyContain(p => p.IsActive);
        result.ProductItems.Should().NotContain(p => p.Sku == "SKU-003");
        result.Total.Should().Be(2);
    }

    [Fact]
    public async Task GetProducts_WithPaginationFilter_AppliesSkipAndTakeCorrectly()
    {
        // Arrange
        var products = Enumerable.Range(1, 15)
            .Select(i => new Product($"SKU-{i:00}", $"Producto {i:00}", 1000m, 10))
            .ToList();
        SetupGetFilteredWith(products);

        var filter = new ProductModel.FilterProduct(Status: null, Search: null, PageNumber: 2, PageSize: 5);

        // Act
        var result = await _service.GetProducts(filter);

        // Assert
        result.ProductItems.Should().HaveCount(5);
        result.ProductItems.Select(p => p.Name).Should().Equal(
            "Producto 06", "Producto 07", "Producto 08", "Producto 09", "Producto 10");
        result.Total.Should().Be(15);
    }

    [Fact]
    public async Task GetProducts_WithSearchTerm_FiltersByNameSkuOrInternalCode()
    {
        // Arrange
        SetupGetFilteredWith(new List<Product>
        {
            new Product("SKU-001", "Mouse Gamer", 15000m, 10, null, "PER001"),
            new Product("SKU-002", "Teclado Mecánico", 30000m, 5, null, "PER002"),
            new Product("SKU-003", "Monitor", 90000m, 3, null, "PAN-001")
        });

        var filter = new ProductModel.FilterProduct(Status: null, Search: "mouse", PageNumber: null, PageSize: null);

        // Act
        var result = await _service.GetProducts(filter);

        // Assert
        result.ProductItems.Should().ContainSingle()
            .Which.Name.Should().Be("Mouse Gamer");
        result.Total.Should().Be(1);
    }
}