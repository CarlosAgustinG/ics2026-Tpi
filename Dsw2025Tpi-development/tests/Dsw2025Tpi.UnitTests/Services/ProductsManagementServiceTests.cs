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

    
}