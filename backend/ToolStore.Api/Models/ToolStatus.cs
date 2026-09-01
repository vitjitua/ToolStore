namespace ToolStore.Api.Models;

public class ToolStatus
{
    public int StatusId { get; set; }

    public string StatusName { get; set; } = null!;

    public bool CanBookOut { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedDate { get; set; }
}