using Dsw2025Tpi.Application.Dtos;
using Dsw2025Tpi.Application.Exceptions;
using Dsw2025Tpi.Application.Services;
using Dsw2025Tpi.Domain.Entities;
using Dsw2025Tpi.Domain.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace Dsw2025Tpi.UnitTests.Services;

public class OrdersManagementServiceTests
{
    private readonly Mock<IRepository> _repositoryMock;
    private readonly Mock<ILogger<OrdersManagementService>> _loggerMock;
    private readonly OrdersManagementService _service;

    public OrdersManagementServiceTests()
    {
        _repositoryMock = new Mock<IRepository>();
        _loggerMock = new Mock<ILogger<OrdersManagementService>>();
        _service = new OrdersManagementService(_repositoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task CreateOrder_WithValidItemsAndStock_CalculatesTotalAndDecrementsProductStock()
    {
        // Arrange
        var customer = new Customer { Name = "Ana Pérez", Email = "ana@test.com" };
        var mouse = new Product("SKU-001", "Mouse Gamer", 1000m, 10);
        var teclado = new Product("SKU-002", "Teclado Mecánico", 500m, 5);

        _repositoryMock
            .Setup(r => r.GetById<Customer>(customer.Id, It.IsAny<string[]>()))
            .ReturnsAsync(customer);
        _repositoryMock
            .Setup(r => r.GetById<Product>(mouse.Id, It.IsAny<string[]>()))
            .ReturnsAsync(mouse);
        _repositoryMock
            .Setup(r => r.GetById<Product>(teclado.Id, It.IsAny<string[]>()))
            .ReturnsAsync(teclado);
        _repositoryMock
            .Setup(r => r.Update(It.IsAny<Product>()))
            .ReturnsAsync((Product p) => p);
        _repositoryMock
            .Setup(r => r.Add(It.IsAny<Order>()))
            .ReturnsAsync((Order o) => o);

        var request = new OrderRequest(
            CustomerId: customer.Id,
            ShippingAddress: "Av. Siempre Viva 742",
            BillingAddress: "Av. Siempre Viva 742",
            Notes: null,
            Items: new List<OrderItemRequest>
            {
                new(mouse.Id, 2),   // 2 x 1000 = 2000
                new(teclado.Id, 3)  // 3 x 500 = 1500
            });

        // Act
        var result = await _service.CreateOrder(request);

        // Assert
        result.TotalAmount.Should().Be(3500m);
        mouse.StockQuantity.Should().Be(8);
        teclado.StockQuantity.Should().Be(2);

        _repositoryMock.Verify(r => r.Update(mouse), Times.Once);
        _repositoryMock.Verify(r => r.Update(teclado), Times.Once);
        _repositoryMock.Verify(
            r => r.Add(It.Is<Order>(o => o.TotalAmount == 3500m && o.OrderItems!.Count == 2)),
            Times.Once);
    }

        [Fact]
    public async Task CreateOrder_WhenProductStockIsInsufficient_ThrowsInsufficientStockException()
    {
        // Arrange
        var customer = new Customer { Name = "Ana Pérez", Email = "ana@test.com" };
        var mouse = new Product("SKU-001", "Mouse Gamer", 1000m, 2);

        _repositoryMock
            .Setup(r => r.GetById<Customer>(customer.Id, It.IsAny<string[]>()))
            .ReturnsAsync(customer);
        _repositoryMock
            .Setup(r => r.GetById<Product>(mouse.Id, It.IsAny<string[]>()))
            .ReturnsAsync(mouse);

        var request = new OrderRequest(
            CustomerId: customer.Id,
            ShippingAddress: "Av. Siempre Viva 742",
            BillingAddress: "Av. Siempre Viva 742",
            Notes: null,
            Items: new List<OrderItemRequest> { new(mouse.Id, 5) });

        // Act
        var act = () => _service.CreateOrder(request);

        // Assert
        await act.Should().ThrowAsync<InsufficientStockException>()
            .WithMessage("El producto 'Mouse Gamer' no tiene suficiente stock. Stock actual: 2, solicitado: 5.");

        mouse.StockQuantity.Should().Be(2);
        _repositoryMock.Verify(r => r.Update(It.IsAny<Product>()), Times.Never);
        _repositoryMock.Verify(r => r.Add(It.IsAny<Order>()), Times.Never);
    }

        [Fact]
    public async Task CreateOrder_WhenCustomerDoesNotExist_ThrowsCustomerNotFoundException()
    {
        // Arrange
        var customerId = Guid.NewGuid();

        _repositoryMock
            .Setup(r => r.GetById<Customer>(customerId, It.IsAny<string[]>()))
            .ReturnsAsync((Customer?)null);

        var request = new OrderRequest(
            CustomerId: customerId,
            ShippingAddress: "Av. Siempre Viva 742",
            BillingAddress: "Av. Siempre Viva 742",
            Notes: null,
            Items: new List<OrderItemRequest> { new(Guid.NewGuid(), 1) });

        // Act
        var act = () => _service.CreateOrder(request);

        // Assert
        await act.Should().ThrowAsync<CustomerNotFoundException>();

        _repositoryMock.Verify(r => r.GetById<Product>(It.IsAny<Guid>(), It.IsAny<string[]>()), Times.Never);
        _repositoryMock.Verify(r => r.Update(It.IsAny<Product>()), Times.Never);
        _repositoryMock.Verify(r => r.Add(It.IsAny<Order>()), Times.Never);
    }
}