import { Skeleton } from "../ui/skeleton";

// Loading tableskeleton component
export const LoadingTableSkeleton = ({col, row}) => (
    <tbody>
      {[...Array(row)].map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b animate-pulse">
          {[...Array(col)].map((_, colIndex) => (
            <td 
              key={colIndex} 
              className={`p-2 `}
            >
              <Skeleton 
                className="h-4 "
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );


 
